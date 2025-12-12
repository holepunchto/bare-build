require.asset = require('require-asset')

exports['android-arm'] = () => {
  return require.asset('../prebuilds/android-arm/bare', __filename)
}

exports['android-arm64'] = () => {
  return require.asset('../prebuilds/android-arm64/bare', __filename)
}

exports['android-ia32'] = () => {
  return require.asset('../prebuilds/android-ia32/bare', __filename)
}

exports['android-x64'] = () => {
  return require.asset('../prebuilds/android-x64/bare', __filename)
}

exports['darwin-arm64'] = () => {
  return require.asset('../prebuilds/darwin-arm64/bare', __filename)
}

exports['darwin-x64'] = () => {
  return require.asset('../prebuilds/darwin-x64/bare', __filename)
}

exports['ios-arm64'] = () => {
  return require.asset('../prebuilds/ios-arm64/bare', __filename)
}

exports['ios-arm64-simulator'] = () => {
  return require.asset('../prebuilds/ios-arm64-simulator/bare', __filename)
}

exports['ios-x64-simulator'] = () => {
  return require.asset('../prebuilds/ios-x64-simulator/bare', __filename)
}

exports['linux-arm64'] = () => {
  return require.asset('../prebuilds/linux-arm64/bare', __filename)
}

exports['linux-x64'] = () => {
  return require.asset('../prebuilds/linux-x64/bare', __filename)
}

exports['win32-arm64'] = () => {
  return require.asset('../prebuilds/win32-arm64/bare.exe', __filename)
}

exports['win32-x64'] = () => {
  return require.asset('../prebuilds/win32-x64/bare.exe', __filename)
}
