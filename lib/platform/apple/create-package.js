const path = require('path')
const fs = require('../../fs')
const run = require('../../run')

module.exports = async function* createPackage(root, components, out, opts = {}) {
  const {
    name,
    version,
    sign = false,
    identity = 'Apple Development',
    installerIdentity = identity,
    keychain
  } = opts

  await fs.makeDir(out)

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

  yield package

  return package
}

function createDistribution(name, version, components) {
  version = version.match(/^\d+(\.\d+){0,2}/).at(0)

  return `\
<installer-gui-script minSpecVersion="1">
  <title>${name}</title>
${components.map(
  (component, i) => `\
  <pkg-ref id="${i}">${component}</pkg-ref>
`
)}
  <choices-outline>
    <line choice="app"/>
  </choices-outline>
  <choice id="app" title="${name}">
${components.map(
  (_, i) => `\
    <pkg-ref id="${i}"/>
`
)}
  </choice>
</installer-gui-script>
`
}
