const path = require('path')
const AppImage = require('#app-image')

// https://docs.appimage.org/packaging-guide/manual.html#creating-an-appimage-from-the-appdir
module.exports = async function* createAppImage(appDir, out, opts = {}) {
  const { name, sign = false, key } = opts

  const appImage = path.resolve(out, name + '.AppImage')

  await AppImage.createAppImage(appDir, appImage, { sign, key, compression: 'zstd' })

  yield appImage

  return appImage
}
