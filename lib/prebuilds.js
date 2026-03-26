exports['android-arm'] = () => {
  return require('bare-build-android-arm')
}

exports['android-arm64'] = () => {
  return require('bare-build-android-arm64')
}

exports['android-ia32'] = () => {
  return require('bare-build-android-ia32')
}

exports['android-x64'] = () => {
  return require('bare-build-android-x64')
}

exports['darwin-arm64'] = () => {
  return require('bare-build-darwin-arm64')
}

exports['darwin-x64'] = () => {
  return require('bare-build-darwin-x64')
}

exports['ios-arm64'] = () => {
  return require('bare-build-ios-arm64')
}

exports['ios-arm64-simulator'] = () => {
  return require('bare-build-ios-arm64-simulator')
}

exports['ios-x64-simulator'] = () => {
  return require('bare-build-ios-x64-simulator')
}

exports['linux-arm64'] = () => {
  return require('bare-build-linux-arm64')
}

exports['linux-x64'] = () => {
  return require('bare-build-linux-x64')
}

exports['win32-arm64'] = () => {
  return require('bare-build-win32-arm64')
}

exports['win32-x64'] = () => {
  return require('bare-build-win32-x64')
}
