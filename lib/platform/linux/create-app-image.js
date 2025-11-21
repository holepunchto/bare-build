const path = require('path')
const run = require('../../run')
const appimagetool = require('../../appimagetool')

// https://docs.appimage.org/packaging-guide/manual.html#creating-an-appimage-from-the-appdir
module.exports = async function createAppImage(pkg, appDir, out, opts = {}) {
  const { name = pkg.name, sign = false, key } = opts

  const appImage = path.resolve(out, name + '.AppImage')

  const args = [appDir]

  if (sign) args.push('--sign', '--sign-key', key)

  args.push(appImage)

  await run(appimagetool, args)

  return appImage
}
