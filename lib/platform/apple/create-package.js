const path = require('path')
const fs = require('../../fs')
const run = require('../../run')

module.exports = async function createPackage(pkg, root, components, out, opts = {}) {
  const {
    name = pkg.name,
    version = pkg.version,
    sign = false,
    identity = 'Apple Development',
    installerIdentity = identity,
    keychain
  } = opts

  const cwd = path.resolve(root, '..')

  const distribution = path.join(cwd, 'distribution.xml')

  await fs.writeFile(distribution, createDistribution(name, version, components))

  const package = path.resolve(out, `${name}.pkg`)

  const args = ['--distribution', 'distribution.xml', '--package-path', '.']

  if (sign) {
    args.push('--timestamp', '--sign', installerIdentity)

    if (keychain) args.push('--keychain', keychain)
  }

  args.push(package)

  await run('productbuild', args, { cwd })

  return package
}

function createDistribution(name, version, components) {
  version = version.match(/^\d+(\.\d+){0,2}/).at(0)

  return `\
<installer-gui-script minSpecVersion="1">
  <title>${name}</title>
${components.map(
  ({ identifier, name }) => `\
  <pkg-ref id="${identifier}">${name}</pkg-ref>
`
)}
  <choices-outline>
    <line choice="app"/>
  </choices-outline>
  <choice id="app" title="${name}">
${components.map(
  ({ identifier }) => `\
    <pkg-ref id="${identifier}"/>
`
)}
  </choice>
</installer-gui-script>
`
}
