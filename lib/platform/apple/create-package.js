const path = require('path')
const fs = require('../../fs')
const run = require('../../run')

module.exports = async function createPackage(pkg, root, components, out, opts = {}) {
  const {
    name = pkg.name,
    version = pkg.version,
    sign = false,
    identity = 'Apple Development',
    keychain
  } = opts

  const cwd = path.resolve(root, '..')

  const distribution = path.join(cwd, 'distribution.xml')

  await fs.writeFile(distribution, createDistribution(name, version, components))

  const package = path.resolve(out, `${name}.pkg`)

  const args = ['--distribution', 'distribution.xml', '--package-path', '.']

  if (sign) {
    args.push('--timestamp', '--sign', identity)

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
  ({ id, name }) => `\
  <pkg-ref id="${id}">${name}</pkg-ref>
`
)}
  <choices-outline>
    <line choice="app"/>
  </choices-outline>
  <choice id="app" title="${name}">
${components.map(
  ({ id }) => `\
    <pkg-ref id="${id}"/>
`
)}
  </choice>
</installer-gui-script>
`
}
