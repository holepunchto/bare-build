const path = require('path')
const fs = require('../fs')
const createMSIX = require('./windows/create-msix')
const createMSIXContentDirectory = require('./windows/create-msix-content-directory')
const createExecutable = require('./windows/create-executable')

module.exports = async function* windows(base, pkg, bundle, opts = {}) {
  const { hosts = [], standalone = false, package = false, out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'win32-arm64':
        arch = 'arm64'
        break
      case 'win32-x64':
        arch = 'x64'
        break
      default:
        throw new Error(`Unknown host '${host}'`)
    }

    archs.set(arch, host)
  }

  const temp = []
  const result = []

  try {
    for (const [arch, host] of archs) {
      let contentDirectory

      if (package) {
        const out = await fs.tempDir()

        temp.push(out)

        contentDirectory = yield* createMSIXContentDirectory(base, pkg, bundle, host, out, opts)
      } else {
        if (standalone) {
          contentDirectory = yield* createExecutable(
            pkg,
            bundle,
            host,
            archs.size === 1 ? path.resolve(out) : path.resolve(out, arch),
            opts
          )
        } else {
          contentDirectory = yield* createMSIXContentDirectory(
            base,
            pkg,
            bundle,
            host,
            archs.size === 1 ? path.resolve(out) : path.resolve(out, arch),
            opts
          )
        }

        result.push(contentDirectory)

        continue
      }

      result.push(
        yield* createMSIX(
          pkg,
          contentDirectory,
          archs.size === 1 ? path.resolve(out) : path.resolve(out, arch)
        )
      )
    }

    return result
  } finally {
    for (const dir of temp) await fs.rm(dir)
  }
}
