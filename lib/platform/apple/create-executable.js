const path = require('path')
const { MachO } = require('bare-lief')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')
const sign = require('./sign')

module.exports = async function* createExecutable(bundle, hosts, out, opts = {}) {
  const { name } = opts

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

  const inputs = hosts.map((host) => prebuilds[host]())

  const binaries = []

  for (const input of inputs) binaries.push(new MachO.FatBinary(await fs.readFile(input)))

  const fat = MachO.FatBinary.merge(binaries)

  const section = new MachO.Section('__bundle', bundle.toBuffer())

  const segment = new MachO.SegmentCommand('__BARE')

  segment.maxProtection = segment.initialProtection = MachO.SegmentCommand.VM_PROTECTIONS.READ

  segment.addSection(section)

  for (const binary of fat) binary.addSegmentCommand(segment)

  const executable = path.join(out, toIdentifier(name))
  fat.toDisk(executable)
  await fs.chmod(executable, 0o755)
  await sign(executable, opts)
  yield executable

  return executable
}

function toIdentifier(input) {
  return input
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
