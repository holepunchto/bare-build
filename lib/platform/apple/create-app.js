const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const { MachO } = require('bare-lief')
const tpl = require('bare-tpl')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')
const { apple } = require('../../assets')
const sign = require('./sign')
const toIdentifier = require('./to-identifier')

// https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle
module.exports = async function* createApp(base, bundle, preflight, hosts, out, opts = {}) {
  const isMac = hosts.some((host) => host.startsWith('darwin'))

  const {
    name,
    identifier = toIdentifier(name),
    version,
    icon = apple.icon,
    identity,
    applicationIdentity = identity,
    provisioningProfile,
    minimumVersion = isMac ? '12.0' : '14.0',
    manifest,
    runtime = { prebuilds }
  } = opts

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

  if (provisioningProfile) {
    await fs.copyFile(
      path.resolve(provisioningProfile),
      path.join(main, 'embedded.mobileprovision')
    )
  }

  const info = path.join(main, 'Info.plist')

  const variables = {
    name,
    identifier,
    version: version.match(/^\d+(\.\d+){0,2}/).at(0),
    minimumVersion
  }

  const createPropertyList = isMac ? createMacOSPropertyList : createIOSPropertyList

  if (manifest) {
    await fs.writeFile(info, tpl.render(await fs.readFile(path.resolve(manifest)), variables))
  } else {
    await fs.writeFile(info, createPropertyList(variables))
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

function createMacOSPropertyList(opts) {
  const { name, identifier, version, minimumVersion } = opts

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
  <key>LSMinimumSystemVersion</key>
  <string>${minimumVersion}</string>
</dict>
</plist>
`
}

function createIOSPropertyList(opts) {
  const { name, identifier, version, minimumVersion } = opts

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
  <key>MinimumOSVersion</key>
  <string>${minimumVersion}</string>
  <key>UILaunchScreen</key>
  <dict>
    <key>UIImageName</key>
    <string></string>
  </dict>
</dict>
</plist>
`
}
