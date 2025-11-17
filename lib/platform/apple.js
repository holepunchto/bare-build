const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const fs = require('../fs')
const run = require('../run')
const prebuilds = require('../prebuilds')

module.exports = async function build(base, pkg, bundle, opts = {}) {
  const { hosts = [], out = '.' } = opts

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
      await app(base, pkg, bundle, hosts, {
        ...opts,
        out: archs.size === 1 ? path.resolve(out) : path.resolve(out, os)
      })
    )
  }

  return apps
}

// https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle
async function app(base, pkg, bundle, hosts, opts = {}) {
  const { name = pkg.name, version = pkg.version, icon, out = '.' } = opts

  const isMac = hosts.some((host) => host.startsWith('darwin'))

  const app = path.resolve(out, `${name}.app`)
  await fs.makeDir(app)

  const main = isMac ? path.join(app, 'Contents') : app
  await fs.makeDir(main)

  const resources = isMac ? path.join(main, 'Resources') : main
  await fs.makeDir(resources)

  const frameworks = path.join(main, 'Frameworks')

  for await (const resource of link(base, { hosts, out: frameworks })) {
    await sign(resource, opts)
  }

  const executable = isMac ? path.join(main, 'MacOS', name) : path.join(main, name)

  if (isMac) {
    await fs.makeDir(path.join(main, 'MacOS'))
  }

  const assets = path.join(resources, 'app')

  const inputs = hosts.map((host) => prebuilds[host]())

  await run('lipo', ['-create', '-output', executable, ...inputs])

  await sign(executable, opts)

  await fs.writeFile(path.join(main, 'Info.plist'), plist(isMac, name, version, opts))

  await fs.writeFile(path.join(main, 'PkgInfo'), 'APPL????')

  bundle = await unpack(bundle, { files: false, assets: true }, async (key) => {
    const target = path.join(assets, key)

    await fs.makeDir(path.dirname(target))
    await fs.writeFile(target, bundle.read(key))

    await sign(target, opts)

    return '/../app' + key
  })

  await fs.writeFile(path.join(resources, 'app.bundle'), bundle.toBuffer())

  await sign(path.join(resources, 'app.bundle'), opts)

  await fs.cp(path.resolve(icon), path.join(resources, 'app' + path.extname(icon)))

  await sign(path.join(resources, 'app' + path.extname(icon)), opts)

  return app
}

async function sign(resource, opts = {}) {
  const {
    sign = false,
    identity = 'Apple Development',
    keychain,
    entitlements,
    hardenedRuntime = false
  } = opts

  if (sign) {
    const args = ['--timestamp', '--force', '--sign', identity]

    if (keychain) args.push('--keychain', keychain)
    if (entitlements) args.push('--entitlements', path.resolve(entitlements))
    if (hardenedRuntime) args.push('--options', 'runtime')

    args.push(resource)

    await run('codesign', args)
  }
}

function plist(isMac, name, version, opts = {}) {
  const { identifier = toIdentifier(name) } = opts

  version = version.match(/^\d+(\.\d+){0,2}/).at(0)

  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
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

// https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier
const invalidBundleIdentifierCharacter = /[^A-Za-z0-9.-]/g

function toIdentifier(input) {
  return input.replace(invalidBundleIdentifierCharacter, '')
}
