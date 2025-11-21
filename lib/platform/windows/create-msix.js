const path = require('path')
const fs = require('../../fs')
const sign = require('./sign')

module.exports = async function createMSIX(pkg, contentDirectory, out, opts = {}) {
  const { name = pkg.name } = opts

  const msix = path.resolve(out, name + '.msix')

  await fs.rm(msix)

  await run('makeappx', ['pack', '/d', contentDirectory, '/p', msix])

  await sign(msix, opts)

  return msix
}
