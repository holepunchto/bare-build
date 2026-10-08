const host = require('#host')

exports.createAppImage = function createAppImage() {
  throw new Error(`Package 'bare-app-image' is not available on host '${host}'`)
}
