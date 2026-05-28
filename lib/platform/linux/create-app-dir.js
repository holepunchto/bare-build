const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const { ELF } = require('bare-lief')
const tpl = require('bare-tpl')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')
const { type } = require('../../constants')
const { linux } = require('../../assets')

const { EXECUTABLE } = type

// https://docs.appimage.org/packaging-guide/manual.html#creating-an-appdir-manually
module.exports = async function* createAppDir(base, bundle, preflight, host, out, opts = {}) {
  const {
    name,
    identifier = toIdentifier(name),
    icon = linux.icon,
    compatibility,
    desktopEntry,
    runtime = { prebuilds }
  } = opts

  const slug = toIdentifier(name)

  const iconBuffer = await fs.readFile(path.resolve(icon))
  const iconSize = getIconSize(icon, iconBuffer)
  const iconPath = path.join('hicolor', iconSize, 'apps', slug + path.extname(icon))

  const app = path.resolve(out, name + '.AppDir')

  const usr = path.join(app, 'usr')

  const bin = path.join(usr, 'bin')
  await fs.makeDir(bin)

  const share = path.join(usr, 'share')

  const applications = path.join(share, 'applications')
  await fs.makeDir(applications)

  const icons = path.join(share, 'icons', 'hicolor', iconSize, 'apps')
  await fs.makeDir(icons)

  const data = path.join(share, slug)
  await fs.makeDir(data)

  const assets = path.join(data, 'app')

  await fs.symlink(path.join('usr', 'bin', slug), path.join(app, 'AppRun'))

  await fs.symlink(
    path.join('usr', 'share', 'applications', slug + '.desktop'),
    path.join(app, slug + '.desktop')
  )

  await fs.symlink(
    path.join('usr', 'share', 'icons', iconPath),
    path.join(app, slug + path.extname(icon))
  )

  await fs.symlink(slug + path.extname(icon), path.join(app, '.DirIcon'))

  yield* link(base, { ...opts, hosts: [host], out: usr })

  const { type, path: prebuild } = runtime.prebuilds[host]()

  if (type !== EXECUTABLE) {
    throw new Error(`Prebuild for '${host}' must be an executable`)
  }

  const binary = new ELF.Binary(await fs.readFile(prebuild))

  const id = binary.getDynamicSymbol('__bare_identifier')

  if (id) {
    let segment = new ELF.Segment()

    segment.type = ELF.Segment.TYPE.LOAD
    segment.flags = ELF.Segment.FLAGS.R
    segment.content = Buffer.concat([Buffer.from(identifier), Buffer.of(0)])

    segment = binary.addSegment(segment)

    const sectionIndex = binary.getSectionIndex('.dynsym')

    id.value = segment.virtualAddress
    id.sectionIndex = sectionIndex
  }

  const executable = path.join(bin, slug)
  binary.toDisk(executable)
  await fs.chmod(executable, 0o755)
  yield executable

  const desktopEntryPath = path.join(applications, slug + '.desktop')

  const isSnap = compatibility === 'snap'

  const variables = {
    name,
    identifier,
    icon: isSnap ? '/usr/share/icons/' + iconPath : slug,
    exec: isSnap ? '/usr/bin/' + slug : slug
  }

  if (desktopEntry) {
    await fs.writeFile(
      desktopEntryPath,
      tpl.render(await fs.readFile(path.resolve(desktopEntry)), variables)
    )
  } else {
    await fs.writeFile(desktopEntryPath, createDesktopEntry(variables))
  }

  yield desktopEntryPath

  const unpacked = []

  bundle = await unpack(bundle, { files: false, assets: true }, async (key) => {
    const target = path.join(assets, key)

    await fs.makeDir(path.dirname(target))
    await fs.writeFile(target, bundle.read(key))

    unpacked.push(target)

    return '/../app' + key
  })

  yield* unpacked

  const appBundle = path.join(data, 'app.bundle')
  await fs.writeFile(appBundle, bundle.toBuffer())
  yield appBundle

  if (preflight) {
    const preflightBundle = path.join(data, 'preflight.bundle')
    await fs.writeFile(preflightBundle, preflight.toBuffer())
    yield preflightBundle
  }

  const appIcon = path.join(icons, slug + path.extname(icon))
  await fs.writeFile(appIcon, iconBuffer)
  yield appIcon

  yield app

  return app
}

function createDesktopEntry(opts) {
  const { name, icon, exec } = opts

  return `\
[Desktop Entry]
Version=1.0
Name=${name}
Icon=${icon}
Exec=${exec}
Type=Application
Categories=Utility;
`
}

function toIdentifier(input) {
  return input
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

// https://specifications.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html
function getIconSize(icon, buffer) {
  const ext = path.extname(icon)

  switch (ext) {
    case '.svg':
      return 'scalable'

    case '.png':
      if (
        buffer.length < 24 ||
        buffer[0] !== 0x89 ||
        buffer[1] !== 0x50 ||
        buffer[2] !== 0x4e ||
        buffer[3] !== 0x47
      ) {
        throw new Error(`'${icon}' has .png extension but is not a valid PNG`)
      }

      return `${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}`

    default:
      throw new Error(`Unsupported icon format '${ext}' for '${icon}'`)
  }
}
