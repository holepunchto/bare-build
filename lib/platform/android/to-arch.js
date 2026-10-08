module.exports = function toArch(host) {
  switch (host) {
    case 'android-arm64':
      return 'arm64-v8a'
    case 'android-arm':
      return 'armeabi-v7a'
    case 'android-ia32':
      return 'x86'
    case 'android-x64':
      return 'x86_64'
    default:
      throw new Error(`Unknown host '${host}'`)
  }
}
