const path = require('path')

module.exports = async function* createAPK(aab, out, opts = {}) {
  const { createAPK } = require('bare-apk') // Optional

  const { name } = opts

  const apk = path.join(out, name + '.apk')
  await createAPK(aab, apk, opts)
  yield apk

  return apk
}
