const path = require('path')
const createExecutable = require('./create-executable')
const toOS = require('./to-os')

module.exports = async function* apple(bundle, opts = {}) {
  const { hosts = [], out = '.' } = opts

  const archs = new Map([
    ['macos', []],
    ['ios', []],
    ['ios-simulator', []]
  ])

  for (const host of hosts) archs.get(toOS(host)).push(host)

  for (const [os, hosts] of archs) if (hosts.length === 0) archs.delete(os)

  const result = []

  for (const [os, hosts] of archs) {
    result.push(
      yield* createExecutable(
        bundle,
        hosts,
        archs.size === 1 ? path.resolve(out) : path.resolve(out, os),
        opts
      )
    )
  }

  return result
}
