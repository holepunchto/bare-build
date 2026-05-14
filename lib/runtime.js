const Bundle = require('bare-bundle')
const Module = require('bare-module')
const { pathToFileURL } = require('bare-url')
const path = require('bare-path')
const os = require('bare-os')
const fs = require('bare-fs')
const unpack = require('bare-unpack')

const app = path.basename(os.execPath())

exports.start = async function start(buffer) {
  const bundle = Bundle.from(Buffer.from(buffer))

  const id = bundle.id

  const temp = path.resolve(os.tmpdir(), app + '-' + id)

  const repacked = await unpack(
    bundle,
    {
      files: false,
      addons: true,
      assets: true
    },
    async (key) => {
      const target = path.join(temp, key)

      try {
        await fs.access(target)
      } catch {
        await fs.mkdir(path.dirname(target), { recursive: true })

        const tmp = target + '.' + os.pid()

        await fs.writeFile(tmp, bundle.read(key))
        await fs.rename(tmp, target)
      }

      return pathToFileURL(target)
    }
  )

  Module.load(new URL('bare:/app.bundle'), repacked.toBuffer())
}
