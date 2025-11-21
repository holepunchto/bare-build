const path = require('path')
const fs = require('../fs')
const createApp = require('./apple/create-app')
const createPackage = require('./apple/create-package')
const createPackageComponent = require('./apple/create-package-component')

module.exports = async function build(base, pkg, bundle, opts = {}) {
  const { hosts = [], package = false, out = '.' } = opts

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

  const temp = []
  const result = []

  try {
    for (const [os, hosts] of archs) {
      if (hosts.length === 0) archs.delete(os)
    }

    for (const [os, hosts] of archs) {
      let root

      if (package) {
        const out = await fs.tempDir()

        temp.push(out)

        root = path.join(out, 'root')

        await createApp(base, pkg, bundle, hosts, path.join(root, 'Applications'), opts)
      } else {
        const app = await createApp(
          base,
          pkg,
          bundle,
          hosts,
          archs.size === 1 ? path.resolve(out) : path.resolve(out, os),
          opts
        )

        result.push(app)

        continue
      }

      const components = [await createPackageComponent(pkg, root, 'app', opts)]

      result.push(
        await createPackage(
          pkg,
          root,
          components,
          archs.size === 1 ? path.resolve(out) : path.resolve(out, os),
          opts
        )
      )
    }

    return result
  } finally {
    for (const dir of temp) await fs.rm(dir)
  }
}
