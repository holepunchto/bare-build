const path = require('path')
const { PE } = require('bare-lief')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')
const sign = require('./sign')

module.exports = async function* createExecutable(bundle, host, out, opts = {}) {
  const { name, runtime = { prebuilds } } = opts

  await fs.makeDir(out)

  const temp = await fs.tempDir()
  try {
    for (const addon of bundle.addons) {
      const target = path.join(temp, addon)
      await fs.makeDir(path.dirname(target))
      await fs.writeFile(target, bundle.read(addon))
      await sign(target, opts)

      bundle.write(addon, await fs.readFile(target))
    }
  } finally {
    await fs.rm(temp)
  }

  const binary = new PE.Binary(await fs.readFile(runtime.prebuilds[host]()))

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
