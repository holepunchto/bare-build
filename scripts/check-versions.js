// Checks that the tag being published matches the root version, every prebuild
// workspace version, and the root's exact pins on them.
//
// npm publishes the workspace root before the workspaces, so a mismatch leaves
// the root published against prebuilds that never were, which npm will not let
// us undo. `Publish` triggers on the tag alone, with no gate on review or CI, so
// this runs before anything goes out.

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

const expected = process.env.GITHUB_REF_NAME.replace(/^v/, '')
const pkg = require(path.join(root, 'package.json'))

// Driven by the directories rather than the pins, so a prebuild that nobody
// pinned is caught instead of silently skipped
const hosts = fs.readdirSync(path.join(root, 'npm'))

const mismatched = []

if (pkg.version !== expected) mismatched.push(`bare-build is ${pkg.version}`)

for (const name of Object.keys(pkg.dependencies)) {
  if (!name.startsWith('bare-build-')) continue

  const host = name.slice('bare-build-'.length)

  if (!hosts.includes(host)) mismatched.push(`${name} has no npm/${host}`)
}

for (const host of hosts) {
  const name = `bare-build-${host}`
  const pin = pkg.dependencies[name]
  const { version } = require(path.join(root, 'npm', host, 'package.json'))

  if (pin === undefined) mismatched.push(`${name} is not a dependency`)
  else if (pin !== expected) mismatched.push(`${name} is pinned to ${pin}`)

  if (version !== expected) mismatched.push(`${name} is ${version}`)
}

if (mismatched.length > 0) {
  console.error(`Expected everything at ${expected}:\n  ${mismatched.join('\n  ')}`)

  process.exit(1)
}
