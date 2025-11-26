const path = require('path')
const { PE } = require('bare-lief')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')

module.exports = async function* createExecutable(pkg, bundle, host, out, opts = {}) {
  const { name = pkg.name || 'App' } = opts

  await fs.makeDir(out)

  const binary = new PE.Binary(await fs.readFile(prebuilds[host]()))

  binary.optionalHeader.subsystem = PE.OptionalHeader.SUBSYSTEM.WINDOWS_CUI

  let section = new PE.Section('.bare')

  section.characteristics =
    PE.Section.CHARACTERISTICS.MEM_READ | PE.Section.CHARACTERISTICS.CNT_INITIALIZED_DATA
  section.content = bundle.toBuffer()

  binary.addSection(section)

  const executable = path.join(out, toIdentifier(name) + '.exe')
  binary.toDisk(executable)
  yield executable

  return executable
}

function toIdentifier(input) {
  return input
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
