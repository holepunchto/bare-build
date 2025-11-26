const path = require('path')
const fs = require('../fs')
const createAppDir = require('./linux/create-app-dir')
const createAppImage = require('./linux/create-app-image')
const createExecutable = require('./linux/create-executable')

module.exports = exports = async function* linux(base, pkg, bundle, opts = {}) {
  const { hosts = [], standalone = false, package = false, out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'linux-arm64':
        arch = 'aarch64'
        break
      case 'linux-x64':
        arch = 'x86_64'
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
      let appDir

      if (package) {
        const out = await fs.tempDir()

        temp.push(out)

        appDir = yield* createAppDir(base, pkg, bundle, host, out, opts)
      } else {
        if (standalone) {
          result.push(
            yield* createExecutable(
              pkg,
              bundle,
              host,
              archs.size === 1 ? path.resolve(out) : path.resolve(out, arch),
              opts
            )
          )
        } else {
          result.push(
            yield* createAppDir(
              base,
              pkg,
              bundle,
              host,
              archs.size === 1 ? path.resolve(out) : path.resolve(out, arch),
              opts
            )
          )
        }

        continue
      }

      result.push(
        yield* createAppImage(
          pkg,
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
