module.exports = function toOS(host) {
  switch (host) {
    case 'darwin-arm64':
    case 'darwin-x64':
      return 'macos'
    case 'ios-arm64':
      return 'ios'
    case 'ios-arm64-simulator':
    case 'ios-x64-simulator':
      return 'ios-simulator'
    default:
      throw new Error(`Unknown host '${host}'`)
  }
}
