require.asset = require('require-asset')

module.exports = {
  apple: {
    icon: require.asset('./assets/apple/icon.png', __filename)
  },
  linux: {
    icon: require.asset('./assets/linux/icon.png', __filename)
  },
  windows: {
    icon: require.asset('./assets/windows/icon.png', __filename)
  }
}
