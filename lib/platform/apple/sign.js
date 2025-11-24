const path = require('path')
const fs = require('../../fs')
const run = require('../../run')

module.exports = async function sign(resource, opts = {}) {
  const {
    sign = false,
    identity = 'Apple Development',
    applicationIdentity = identity,
    keychain,
    entitlements,
    hardenedRuntime = false
  } = opts

  const temp = []

  try {
    if (sign) {
      const args = ['--timestamp', '--force', '--sign', applicationIdentity]

      if (keychain) args.push('--keychain', keychain)

      if (entitlements) args.push('--entitlements', path.resolve(entitlements))
      else {
        const out = await fs.tempDir()

        temp.push(out)

        const entitlements = path.join(out, 'Entitlements.plist')

        await fs.writeFile(entitlements, createEntitlements(opts))

        args.push('--entitlements', entitlements)
      }

      if (hardenedRuntime) args.push('--options', 'runtime')

      args.push(resource)

      await run('codesign', args)
    } else {
      await run('codesign', ['--timestamp=none', '--force', '--sign', '-', resource])
    }
  } finally {
    for (const dir of temp) await fs.rm(dir)
  }
}

function createEntitlements(opts = {}) {
  const { hardenedRuntime = false } = opts

  const entitlements = []

  if (hardenedRuntime) {
    entitlements.push(
      'com.apple.security.cs.allow-jit',
      'com.apple.security.cs.allow-unsigned-executable-memory'
    )
  }

  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>${entitlements
    .map(
      (entitlement) => `
  <key>${entitlement}</key>
  <true/>
`
    )
    .join('\n')}
</dict>
</plist>
`
}
