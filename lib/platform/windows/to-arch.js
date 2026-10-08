module.exports = function toArch(host) {
  switch (host) {
    case 'win32-arm64':
      return 'arm64'
    case 'win32-x64':
      return 'x64'
    default:
      throw new Error(`Unknown host '${host}'`)
  }
}
