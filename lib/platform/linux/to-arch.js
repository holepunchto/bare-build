module.exports = function toArch(host) {
  switch (host) {
    case 'linux-arm64':
      return 'aarch64'
    case 'linux-x64':
      return 'x86_64'
    default:
      throw new Error(`Unknown host '${host}'`)
  }
}
