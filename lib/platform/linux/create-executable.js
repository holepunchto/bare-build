const path = require('path')
const { ELF } = require('bare-lief')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')

module.exports = async function* createExecutable(bundle, host, out, opts = {}) {
  const { name, runtime = { prebuilds } } = opts

  await fs.makeDir(out)

  const binary = new ELF.Binary(await fs.readFile(runtime.prebuilds[host]()))

  let segment = new ELF.Segment()

  segment.type = ELF.Segment.TYPE.LOAD
  segment.flags = ELF.Segment.FLAGS.R
  segment.content = bundle.toBuffer()

  segment = binary.addSegment(segment)

  const sectionIndex = binary.getSectionIndex('.dynsym')

  const begin = binary.getDynamicSymbol('__bare_bundle_begin')

  begin.value = segment.virtualAddress
  begin.sectionIndex = sectionIndex

  const end = binary.getDynamicSymbol('__bare_bundle_end')

  end.value = segment.virtualAddress + segment.virtualSize
  end.sectionIndex = sectionIndex

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
