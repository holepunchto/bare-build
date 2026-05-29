const path = require('path')
const { Version } = require('bare-semver')
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

  const pkg = path.resolve(out, `${name}.pkg`)

  const args = ['--distribution', 'distribution.xml', '--package-path', '.']

  if (sign) {
    args.push('--timestamp', '--sign', installerIdentity)

    if (keychain) args.push('--keychain', keychain)
  }

  args.push(pkg)

  await run('productbuild', args, { cwd })

  yield pkg

  return pkg
}

function createDistribution(name, version, components) {
  const { major, minor, patch } = Version.parse(version)

  version = `${major}.${minor}.${patch}`

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
