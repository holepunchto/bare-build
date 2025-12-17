const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const { MachO } = require('bare-lief')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')
const { apple } = require('../../assets')
const sign = require('./sign')
const toIdentifier = require('./to-identifier')

// https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle
module.exports = async function* createApp(base, bundle, preflight, hosts, out, opts = {}) {
  const {
    name,
    version,
    icon = apple.icon,
    identity,
    applicationIdentity = identity,
    manifest,
    runtime = { prebuilds }
  } = opts

  const isMac = hosts.some((host) => host.startsWith('darwin'))

  const app = path.resolve(out, `${name}.app`)
  await fs.makeDir(app)

  const main = isMac ? path.join(app, 'Contents') : app
  await fs.makeDir(main)

  const resources = isMac ? path.join(main, 'Resources') : main
  await fs.makeDir(resources)

  const assets = path.join(resources, 'app')

  const frameworks = path.join(main, 'Frameworks')

  if (isMac) await fs.makeDir(path.join(main, 'MacOS'))

  yield* link(base, { ...opts, hosts, identity: applicationIdentity, out: frameworks })

  const inputs = hosts.map((host) => runtime.prebuilds[host]())

  const binaries = []

  for (const input of inputs) binaries.push(new MachO.FatBinary(await fs.readFile(input)))

  const fat = MachO.FatBinary.merge(binaries)

  const executable = isMac ? path.join(main, 'MacOS', name) : path.join(main, name)
  fat.toDisk(executable)
  await fs.chmod(executable, 0o755)
  await sign(executable, opts)
  yield executable

  const info = path.join(main, 'Info.plist')

  if (manifest) {
    await fs.copyFile(path.resolve(manifest), info)
  } else {
    await fs.writeFile(info, createPropertyList(isMac, name, version, opts))
  }

  yield info

  const pkgInfo = path.join(main, 'PkgInfo')
  await fs.writeFile(pkgInfo, 'APPL????')
  yield pkgInfo

  const unpacked = []

  bundle = await unpack(bundle, { files: false, assets: true }, async (key) => {
    const target = path.join(assets, key)

    await fs.makeDir(path.dirname(target))
    await fs.writeFile(target, bundle.read(key))

    await sign(target, opts)

    unpacked.push(target)

    return '/../app' + key
  })

  yield* unpacked

  const appBundle = path.join(resources, 'app.bundle')
  await fs.writeFile(appBundle, bundle.toBuffer())
  await sign(appBundle, opts)
  yield appBundle

  if (preflight) {
    const preflightBundle = path.join(resources, 'preflight.bundle')
    await fs.writeFile(preflightBundle, preflight.toBuffer())
    await sign(preflightBundle, opts)
    yield preflightBundle
  }

  const appIcon = path.join(resources, 'app' + path.extname(icon))
  await fs.cp(path.resolve(icon), appIcon)
  await sign(appIcon, opts)
  yield appIcon

  await sign(app, opts)
  yield app

  return app
}

function createPropertyList(isMac, name, version, opts = {}) {
  const { identifier = toIdentifier(name) } = opts

  version = version.match(/^\d+(\.\d+){0,2}/).at(0)

  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>${name}</string>
  <key>CFBundleIdentifier</key>
  <string>${identifier}</string>
  <key>CFBundleVersion</key>
  <string>${version}</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleExecutable</key>
  <string>${name}</string>
  <key>CFBundleIconFile</key>
  <string>app</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleSignature</key>
  <string>????</string>
  <key>${isMac ? 'LSMinimumSystemVersion' : 'MinimumOSVersion'}</key>
  <string>${isMac ? '12.0' : '14.0'}</string>
</dict>
</plist>
`
}
