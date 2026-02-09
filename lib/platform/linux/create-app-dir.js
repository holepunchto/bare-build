const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const { ELF } = require('bare-lief')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')
const { linux } = require('../../assets')

// https://docs.appimage.org/packaging-guide/manual.html#creating-an-appdir-manually
module.exports = async function* createAppDir(base, bundle, preflight, host, out, opts = {}) {
  const { name, identifier = toIdentifier(name), icon = linux.icon, runtime = { prebuilds } } = opts

  const app = path.resolve(out, name + '.AppDir')

  const usr = path.join(app, 'usr')

  const bin = path.join(usr, 'bin')
  await fs.makeDir(bin)

  const share = path.join(usr, 'share')

  const applications = path.join(share, 'applications')
  await fs.makeDir(applications)

  const icons = path.join(share, 'icons')
  await fs.makeDir(icons)

  const data = path.join(share, toIdentifier(name))
  await fs.makeDir(data)

  const assets = path.join(data, 'app')

  await fs.symlink(path.join('usr', 'bin', toIdentifier(name)), path.join(app, 'AppRun'))

  await fs.symlink(
    path.join('usr', 'share', 'applications', name + '.desktop'),
    path.join(app, name + '.desktop')
  )

  await fs.symlink(
    path.join('usr', 'share', 'icons', name + path.extname(icon)),
    path.join(app, name + path.extname(icon))
  )

  await fs.symlink(name + path.extname(icon), path.join(icons, name))

  await fs.symlink(name + path.extname(icon), path.join(app, '.DirIcon'))

  yield* link(base, { ...opts, hosts: [host], out: usr })

  const binary = new ELF.Binary(await fs.readFile(runtime.prebuilds[host]()))

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

  const executable = path.join(bin, toIdentifier(name))
  binary.toDisk(executable)
  await fs.chmod(executable, 0o755)
  yield executable

  const desktopEntry = path.join(applications, name + '.desktop')
  await fs.writeFile(desktopEntry, createDesktopEntry(name, opts))
  yield desktopEntry

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

  const appIcon = path.join(icons, name + path.extname(icon))
  await fs.cp(path.resolve(icon), appIcon)
  yield appIcon

  yield app

  return app
}

function createDesktopEntry(name, opts = {}) {
  const { compatibility } = opts

  const isSnap = compatibility === 'snap'

  return `\
[Desktop Entry]
Version=1.0
Name=${name}
Icon=${isSnap ? '/usr/share/icons/' : ''}${name}
Exec=${isSnap ? '/usr/bin/' : ''}${toIdentifier(name)}
Type=Application
Categories=
`
}

function toIdentifier(input) {
  return input
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
