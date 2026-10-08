const host = require('#host')

module.exports = {
  get constants() {
    return unsupported()
  },
  createAppBundle: unsupported,
  createAPK: unsupported
}

function unsupported() {
  throw new Error(`Package 'bare-apk' is not available on host '${host}'`)
}
