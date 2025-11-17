const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const fs = require('../fs')
const run = require('../run')
const prebuilds = require('../prebuilds')

module.exports = async function build(base, bundle, opts = {}) {
  const { hosts = [], out = path.resolve('.') } = opts

  const archs = new Map([
    ['macos', []],
    ['ios', []],
    ['ios-simulator', []]
  ])

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'darwin-arm64':
      case 'darwin-x64':
        arch = archs.get('macos')
        break
      case 'ios-arm64':
        arch = archs.get('ios')
        break
      case 'ios-arm64-simulator':
      case 'ios-x64-simulator':
        arch = archs.get('ios-simulator')
        break
      default:
        throw new Error(`Unknown host '${host}'`)
    }

    arch.push(host)
  }

  const apps = []

  for (const [os, hosts] of archs) {
    if (hosts.length === 0) archs.delete(os)
  }

  for (const [os, hosts] of archs) {
    apps.push(
      await app(os, base, bundle, hosts, {
        ...opts,
        out: archs.size === 1 ? out : path.join(out, os)
      })
    )
  }

  return apps
}

// https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle
async function app(os, base, bundle, hosts, opts = {}) {
  const isMac = os === 'macos'

  const { name = 'App', version = '1.0.0', icon, out = path.resolve('.') } = opts

  const app = path.join(out, `${name}.app`)
  await fs.makeDir(app)

  const main = isMac ? path.join(app, 'Contents') : app
  await fs.makeDir(main)

  const resources = isMac ? path.join(main, 'Resources') : main
  await fs.makeDir(resources)

  const frameworks = path.join(main, 'Frameworks')

  await link(base, { hosts, out: frameworks })

  const executable = isMac ? path.join(main, 'MacOS', name) : path.join(main, name)

  if (isMac) {
    await fs.makeDir(path.join(main, 'MacOS'))
  }

  const assets = path.join(resources, 'app')

  const inputs = hosts.map((host) => prebuilds[host]())

  await run('lipo', ['-create', '-output', executable, ...inputs])

  await fs.writeFile(path.join(main, 'Info.plist'), plist(os, name, version))

  await fs.writeFile(path.join(main, 'PkgInfo'), 'APPL????')

  bundle = await unpack(bundle, { files: false, assets: true }, async (key) => {
    const target = path.join(assets, key)

    await fs.makeDir(path.dirname(target))
    await fs.writeFile(target, bundle.read(key))

    return '/../app' + key
  })

  await fs.writeFile(path.join(resources, 'app.bundle'), bundle.toBuffer())

  if (icon) await fs.cp(path.resolve(icon), path.join(resources, 'app' + path.extname(icon)))

  return app
}

// https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier
const invalidBundleIdentifierCharacter = /[^A-Za-z0-9.-]/g

function plist(os, name, version) {
  const isMac = os === 'macos'

  version = version.match(/^\d+(\.\d+){0,2}/).at(0)

  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${name.replace(invalidBundleIdentifierCharacter, '-')}.${version}</string>
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
