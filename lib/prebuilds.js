const { type } = require('./constants')

const { EXECUTABLE } = type

exports['android-arm'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-android-arm'),
    dependencies: []
  }
}

exports['android-arm64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-android-arm64'),
    dependencies: []
  }
}

exports['android-ia32'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-android-ia32'),
    dependencies: []
  }
}

exports['android-x64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-android-x64'),
    dependencies: []
  }
}

exports['darwin-arm64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-darwin-arm64'),
    dependencies: []
  }
}

exports['darwin-x64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-darwin-x64'),
    dependencies: []
  }
}

exports['ios-arm64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-ios-arm64'),
    dependencies: []
  }
}

exports['ios-arm64-simulator'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-ios-arm64-simulator'),
    dependencies: []
  }
}

exports['ios-x64-simulator'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-ios-x64-simulator'),
    dependencies: []
  }
}

exports['linux-arm64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-linux-arm64'),
    dependencies: []
  }
}

exports['linux-x64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-linux-x64'),
    dependencies: []
  }
}

exports['win32-arm64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-win32-arm64'),
    dependencies: []
  }
}

exports['win32-x64'] = () => {
  return {
    type: EXECUTABLE,
    path: require('bare-build-win32-x64'),
    dependencies: []
  }
}
