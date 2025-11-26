const path = require('path')
const { ELF } = require('bare-lief')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')

module.exports = async function* createExecutable(pkg, bundle, host, out, opts = {}) {
  const { name = pkg.name || 'App' } = opts

  await fs.makeDir(out)

  const binary = new ELF.Binary(await fs.readFile(prebuilds[host]()))

  let section = new ELF.Section('.bare')

  section.flags = ELF.Section.FLAGS.ALLOC
  section.content = bundle.toBuffer()

  section = binary.addSection(section)

  const sectionIndex = binary.getSectionIndex('.bare')

  const begin = new ELF.Symbol('__bare_bundle_begin')

  begin.value = section.virtualAddress
  begin.binding = ELF.Symbol.BINDING.GLOBAL
  begin.sectionIndex = sectionIndex

  const end = new ELF.Symbol('__bare_bundle_end')

  end.value = section.virtualAddress + section.size
  end.binding = ELF.Symbol.BINDING.GLOBAL
  end.sectionIndex = sectionIndex

  binary.addDynamicSymbol(begin)
  binary.addDynamicSymbol(end)

  const executable = path.join(out, toIdentifier(name))
  binary.toDisk(executable)
  await fs.chmod(executable, 0o755)
  yield executable

  return executable
}

function toIdentifier(input) {
  return input
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
