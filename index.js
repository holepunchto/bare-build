const path = require('path')
const standalone = require('./standalone')
const resolveOptions = require('./lib/options')
const packBundle = require('./lib/pack-bundle')
const groupHosts = require('./lib/group-hosts')
const constants = require('./lib/constants')

const platforms = {
  apple: require('./lib/platform/apple'),
  android: require('./lib/platform/android'),
  linux: require('./lib/platform/linux'),
  windows: require('./lib/platform/windows')
}

module.exports = exports = async function* build(entry, preflight = null, opts = {}) {
  if (typeof preflight === 'object' && preflight !== null) {
    opts = preflight
    preflight = null
  }

  if (opts.standalone && opts.package) {
    throw new Error('Options `standalone` and `package` are mutually exclusive')
  }

  if (opts.standalone) {
    if (preflight) throw new Error('Option `preflight` is not supported in standalone mode')

    return yield* standalone(entry, opts)
  }

  opts = await resolveOptions(opts)

  const { base, hosts } = opts

  const groups = groupHosts(hosts, platforms)

  const entries = [entry, preflight].filter(Boolean).map((entry) => path.resolve(entry))

  // Linking only needs the entry points, so it doesn't wait for packing.
  entry = packBundle(entry, { hosts, linked: true }, base)
  entry.catch(noop)

  if (preflight) {
    preflight = packBundle(preflight, { hosts, linked: true }, base)
    preflight.catch(noop)
  }

  for (const [platform, hosts] of groups) {
    yield* platform(entries, entry, preflight, { ...opts, hosts })
  }
}

exports.constants = constants

function noop() {}
