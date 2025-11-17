const fs = require('fs')

require.asset = require('require-asset')

try {
  const appimagetool = require.asset('#appimagetool', __filename)

  try {
    fs.accessSync(appimagetool, fs.constants.X_OK)
  } catch {
    fs.chmodSync(appimagetool, 0o755)
  }

  module.exports = appimagetool
} catch {
  module.exports = null
}
