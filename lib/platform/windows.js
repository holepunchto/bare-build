const path = require('path')
const fs = require('../fs')
const createMSIX = require('./windows/create-msix')
const createMSIXContentDirectory = require('./windows/create-msix-content-directory')
const toArch = require('./windows/to-arch')

module.exports = async function* windows(entries, bundle, preflight, opts = {}) {
  const { hosts = [], package: pkg = false, out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) archs.set(toArch(host), host)

  const temp = []
  const result = []

  try {
    for (const [arch, host] of archs) {
      let contentDirectory

      if (pkg) {
        const out = await fs.tempDir()

        temp.push(out)

        contentDirectory = yield* createMSIXContentDirectory(
          entries,
          bundle,
          preflight,
          host,
          out,
          opts
        )
      } else {
        result.push(
          yield* createMSIXContentDirectory(
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
        yield* createMSIX(
          contentDirectory,
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
