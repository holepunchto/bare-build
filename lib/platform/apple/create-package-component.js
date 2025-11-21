const path = require('path')
const run = require('../../run')
const toIdentifier = require('./to-identifier')

module.exports = async function createPackageComponent(pkg, root, id, opts = {}) {
  if (typeof id === 'object' && id !== null) {
    opts = id
    id = null
  }

  let {
    name = pkg.name,
    version = pkg.version,
    identifier = toIdentifier(name),
    sign = false,
    identity = 'Apple Development',
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
    args.push('--timestamp', '--sign', identity)

    if (keychain) args.push('--keychain', keychain)
  }

  args.push(component)

  await run('pkgbuild', args, { cwd })

  return {
    identifier,
    name
  }
}
