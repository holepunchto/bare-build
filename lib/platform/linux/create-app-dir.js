const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')

// https://docs.appimage.org/packaging-guide/manual.html#creating-an-appdir-manually
module.exports = async function createAppDir(base, pkg, bundle, host, out, opts = {}) {
  const { name = pkg.name, icon } = opts

  const app = path.resolve(out, name + '.AppDir')

  const usr = path.join(app, 'usr')

  const bin = path.join(usr, 'bin')
  await fs.makeDir(bin)

  const executable = path.join(bin, toIdentifier(name))

  await fs.copyFile(prebuilds[host](), executable)

  await fs.symlink(path.join('usr', 'bin', toIdentifier(name)), path.join(app, 'AppRun'))

  const share = path.join(usr, 'share')

  const applications = path.join(share, 'applications')
  await fs.makeDir(applications)

  const data = path.join(share, toIdentifier(name))
  await fs.makeDir(data)

  const assets = path.join(data, 'app')

  for await (const _ of link(base, { hosts: [host], out: usr })) {
    continue
  }

  await fs.writeFile(path.join(applications, name + '.desktop'), createDesktopEntry(name))

  await fs.symlink(
    path.join('usr', 'share', 'applications', name + '.desktop'),
    path.join(app, name + '.desktop')
  )

  bundle = await unpack(bundle, { files: false, assets: true }, async (key) => {
    const target = path.join(assets, key)

    await fs.makeDir(path.dirname(target))
    await fs.writeFile(target, bundle.read(key))

    return '/../app' + key
  })

  await fs.writeFile(path.join(data, 'app.bundle'), bundle.toBuffer())

  const icons = path.join(share, 'icons')
  await fs.makeDir(icons)

  await fs.cp(path.resolve(icon), path.join(icons, name + path.extname(icon)))

  await fs.symlink(
    path.join('usr', 'share', 'icons', name + path.extname(icon)),
    path.join(app, name + path.extname(icon))
  )

  await fs.symlink(name + path.extname(icon), path.join(app, '.DirIcon'))

  return app
}

function createDesktopEntry(name) {
  return `\
[Desktop Entry]
Version=1.0
Name=${name}
Icon=${name}
Exec=${toIdentifier(name)}
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
