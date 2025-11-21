const run = require('../../run')

module.exports = async function sign(resource, opts = {}) {
  const { sign = false, subjectName, thumbprint } = opts

  if (sign) {
    const args = ['sign', '/a', '/fd', 'SHA256', '/t', 'http://timestamp.digicert.com']

    if (subjectName) args.push('/n', subjectName)
    if (thumbprint) args.push('/sha1', thumbprint)

    args.push(resource)

    await run('signtool', args)
  }
}
