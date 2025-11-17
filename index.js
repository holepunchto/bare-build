const path = require('path')
const { pathToFileURL } = require('url')
const { resolve } = require('bare-module-traverse')
const id = require('bare-bundle-id')
const pack = require('bare-pack')
const fs = require('bare-pack/fs')

const apple = require('./lib/platform/apple')
const linux = require('./lib/platform/linux')
const windows = require('./lib/platform/windows')

module.exports = async function build(entry, opts = {}) {
  const { base = path.resolve('.'), target = [], hosts = target } = opts

  const pkg = require(path.join(base, 'package.json'))

  let bundle = await pack(
    pathToFileURL(entry),
    {
      hosts,
      linked: true,
      resolve: resolve.bare
    },
    fs.readModule,
    fs.listPrefix
  )

  bundle = bundle.unmount(pathToFileURL(base))

  bundle.id = id(bundle).toString('hex')

  const groups = new Map()

  for (const host of hosts) {
    let platform

    switch (host) {
      case 'darwin-arm64':
      case 'darwin-x64':
      case 'ios-arm64':
      case 'ios-arm64-simulator':
      case 'ios-x64-simulator':
        platform = apple
        break
      case 'linux-arm64':
      case 'linux-x64':
        platform = linux
        break
      case 'win32-arm64':
      case 'win32-x64':
        platform = windows
        break
      default:
        throw new Error(`Unknown host '${host}'`)
    }

    let group = groups.get(platform)

    if (group === undefined) {
      group = []
      groups.set(platform, group)
    }

    group.push(host)
  }

  for (const [platform, hosts] of groups) {
    await platform(base, pkg, bundle, { ...opts, hosts })
  }
}
