const path = require('path')
const createExecutable = require('./create-executable')
const toArch = require('./to-arch')

module.exports = async function* windows(bundle, opts = {}) {
  const { hosts = [], out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) archs.set(toArch(host), host)

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
