const createAppBundle = require('./android/create-app-bundle')

module.exports = async function* android(entries, bundle, preflight, opts = {}) {
  const { hosts = [], package: pkg = false, out = '.' } = opts

  if (pkg) return [yield* createAppBundle(entries, bundle, preflight, hosts, out, opts)]

  return [yield* createAppBundle(entries, bundle, preflight, hosts, out, opts, 'apk')]
}
