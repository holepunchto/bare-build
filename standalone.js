const path = require('path')
const resolveOptions = require('./lib/options')
const packBundle = require('./lib/pack-bundle')
const groupHosts = require('./lib/group-hosts')
const constants = require('./lib/constants')

const platforms = {
  apple: require('./lib/platform/apple/standalone'),
  android: require('./lib/platform/android/standalone'),
  linux: require('./lib/platform/linux/standalone'),
  windows: require('./lib/platform/windows/standalone')
}

module.exports = exports = async function* build(entry, opts = {}) {
  opts = await resolveOptions(opts)

  const { base, hosts, defer } = opts

  const groups = groupHosts(hosts, platforms)

  const bundle = packBundle(path.resolve(entry), { hosts, linked: false, defer }, base)
  bundle.catch(noop)

  for (const [platform, hosts] of groups) {
    yield* platform(bundle, { ...opts, hosts })
  }
}

exports.constants = constants

function noop() {}
