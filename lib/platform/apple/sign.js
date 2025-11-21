const path = require('path')
const run = require('../../run')

module.exports = async function sign(resource, opts = {}) {
  const {
    sign = false,
    identity = 'Apple Development',
    keychain,
    entitlements,
    hardenedRuntime = false
  } = opts

  if (sign) {
    const args = ['--timestamp', '--force', '--sign', identity]

    if (keychain) args.push('--keychain', keychain)
    if (entitlements) args.push('--entitlements', path.resolve(entitlements))
    if (hardenedRuntime) args.push('--options', 'runtime')

    args.push(resource)

    await run('codesign', args)
  }
}
