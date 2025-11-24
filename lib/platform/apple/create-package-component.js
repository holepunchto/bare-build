const path = require('path')
const fs = require('../../fs')
const run = require('../../run')
const toIdentifier = require('./to-identifier')

module.exports = async function* createPackageComponent(pkg, root, id, opts = {}) {
  if (typeof id === 'object' && id !== null) {
    opts = id
    id = null
  }

  let {
    name = pkg.name || 'App',
    version = pkg.version || '1.0.0',
    identifier = toIdentifier(name),
    sign = false,
    identity = 'Apple Development',
    installerIdentity = identity,
    keychain
  } = opts

  if (id) {
    identifier = `${identifier}.${id}`
    name = `${name}-${id}`
  }

  name += '.pkg'

  const cwd = path.resolve(root, '..')

  const component = path.join(cwd, name)

  const args = [
    '--root',
    'root',
    '--identifier',
    identifier,
    '--version',
    version,
    '--install-location',
    '/'
  ]

  if (sign) {
    args.push('--timestamp', '--sign', installerIdentity)

    if (keychain) args.push('--keychain', keychain)
  }

  args.push(component)

  await run('pkgbuild', args, { cwd })

  yield component

  return component
}
