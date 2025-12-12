const path = require('path')
const fs = require('../fs')
const createAppBundle = require('./android/create-app-bundle')
const createAPK = require('./android/create-apk')
const createExecutable = require('./linux/create-executable')

module.exports = async function* android(base, bundle, preflight, opts = {}) {
  const { hosts = [], standalone = false, package = false, out = '.' } = opts

  if (standalone) {
    const archs = new Map()

    for (const host of hosts) {
      let arch

      switch (host) {
        case 'android-arm64':
          arch = 'arm64-v8a'
          break
        case 'android-arm':
          arch = 'armeabi-v7a'
          break
        case 'android-ia32':
          arch = 'x86'
          break
        case 'android-x64':
          arch = 'x86_64'
          break
        default:
          throw new Error(`Unknown host '${host}'`)
      }

      archs.set(arch, host)
    }

    const result = []

    for (const [arch, host] of archs) {
      result.push(
        yield* createExecutable(
          bundle,
          host,
          archs.size === 1 ? path.resolve(out) : path.resolve(out, arch),
          opts
        )
      )
    }

    return result
  }

  if (package) return [yield* createAppBundle(base, bundle, hosts, out, opts)]

  const temp = []

  try {
    const build = await fs.tempDir()

    temp.push(build)

    const aab = yield* createAppBundle(base, bundle, hosts, build, opts)

    return [yield* createAPK(aab, out, opts)]
  } finally {
    for (const dir of temp) await fs.rm(dir)
  }
}
