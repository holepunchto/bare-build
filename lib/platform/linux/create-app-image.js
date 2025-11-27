const path = require('path')

// https://docs.appimage.org/packaging-guide/manual.html#creating-an-appimage-from-the-appdir
module.exports = async function* createAppImage(appDir, out, opts = {}) {
  const createAppImage = require('bare-app-image') // Optional

  const { name, sign = false, key } = opts

  const appImage = path.resolve(out, name + '.AppImage')

  await createAppImage(appDir, appImage, { sign, key, compression: 'zstd' })

  yield appImage

  return appImage
}
