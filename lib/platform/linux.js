const path = require('path')
const fs = require('../fs')
const createAppDir = require('./linux/create-app-dir')
const createAppImage = require('./linux/create-app-image')
const toArch = require('./linux/to-arch')

module.exports = exports = async function* linux(entries, bundle, preflight, opts = {}) {
  const { hosts = [], package: pkg = false, out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) archs.set(toArch(host), host)

  const temp = []
  const result = []

  try {
    for (const [arch, host] of archs) {
      let appDir

      if (pkg) {
        const out = await fs.tempDir()

        temp.push(out)

        appDir = yield* createAppDir(entries, bundle, preflight, host, out, opts)
      } else {
        result.push(
          yield* createAppDir(
            entries,
            bundle,
            preflight,
            host,
            archs.size === 1 ? path.resolve(out) : path.resolve(out, arch),
            opts
          )
        )

        continue
      }

      result.push(
        yield* createAppImage(
          appDir,
          archs.size === 1 ? path.resolve(out) : path.resolve(out, arch),
          opts
        )
      )
    }

    return result
  } finally {
    for (const dir of temp) await fs.rm(dir)
  }
}

exports.sign = async function sign() {}
