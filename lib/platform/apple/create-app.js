const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const fs = require('../../fs')
const run = require('../../run')
const prebuilds = require('../../prebuilds')
const sign = require('./sign')
const toIdentifier = require('./to-identifier')

// https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle
module.exports = async function createApp(base, pkg, bundle, hosts, out, opts = {}) {
  const { name = pkg.name, version = pkg.version, icon } = opts

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

  await fs.writeFile(path.join(main, 'Info.plist'), createPropertyList(isMac, name, version, opts))

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
