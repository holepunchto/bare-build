require.asset = require('require-asset')

module.exports = {
  apple: {
    icon: require.asset('./assets/apple/icon.png', __filename)
  },
  linux: {
    icon: require.asset('./assets/linux/icon.png', __filename)
  },
  win32: {
    icon: require.asset('./assets/win32/icon.png', __filename)
  }
}
