const path = require('path')
const fs = require('../fs')
const createApp = require('./apple/create-app')
const createPackage = require('./apple/create-package')
const createPackageComponent = require('./apple/create-package-component')
const toOS = require('./apple/to-os')

module.exports = async function* apple(entries, bundle, preflight, opts = {}) {
  const { hosts = [], package: pkg = false, out = '.' } = opts

  const archs = new Map([
    ['macos', []],
    ['ios', []],
    ['ios-simulator', []]
  ])

  for (const host of hosts) archs.get(toOS(host)).push(host)

  const temp = []
  const result = []

  try {
    for (const [os, hosts] of archs) if (hosts.length === 0) archs.delete(os)

    for (const [os, hosts] of archs) {
      let root

      if (pkg) {
        const out = await fs.tempDir()

        temp.push(out)

        root = path.join(out, 'root')

        yield* createApp(entries, bundle, preflight, hosts, path.join(root, 'Applications'), opts)
      } else {
        result.push(
          yield* createApp(
            entries,
            bundle,
            preflight,
            hosts,
            archs.size === 1 ? path.resolve(out) : path.resolve(out, os),
            opts
          )
        )

        continue
      }

      const components = [yield* createPackageComponent(root, opts)]

      result.push(
        yield* createPackage(
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
