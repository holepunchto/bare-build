const path = require('path')
const { pathToFileURL, fileURLToPath } = require('url')
const traverse = require('bare-module-traverse')
const resolve = require('bare-module-resolve')
const id = require('bare-bundle-id')
const pack = require('bare-pack')
const { readModule, listPrefix } = require('bare-pack/fs')
const fs = require('./lib/fs')

module.exports = async function* build(entry, opts = {}) {
  const { base = '.', target = [], hosts = target, standalone = false } = opts

  let pkg
  try {
    pkg = require(path.resolve(base, 'package.json'))
  } catch {
    pkg = null
  }

  if (pkg) {
    const {
      name = opts.name || pkg.name || 'App',
      version = opts.version || pkg.version || '1.0.0',
      description = opts.description || pkg.description,
      author = opts.author || pkg.author
    } = pkg

    opts = { ...opts, name, version, description, author }
  }

  if (typeof opts.runtime === 'string') {
    opts = { ...opts, runtime: await requireRelativeTo(opts.runtime, pathToFileURL(base + '/')) }
  }

  let bundle = await pack(
    pathToFileURL(entry),
    {
      hosts,
      linked: standalone === false,
      resolve: traverse.resolve.bare
    },
    readModule,
    listPrefix
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
        platform = require('./lib/platform/apple')
        break
      case 'linux-arm64':
      case 'linux-x64':
        platform = require('./lib/platform/linux')
        break
      case 'win32-arm64':
      case 'win32-x64':
        platform = require('./lib/platform/windows')
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
    yield* platform(base, bundle, { ...opts, hosts })
  }
}

async function requireRelativeTo(specifier, parentURL) {
  for await (const candidate of resolve(specifier, parentURL, readPackage)) {
    if (await fs.isFile(candidate)) {
      return require(fileURLToPath(candidate))
    }
  }

  throw new Error(`Cannot find module '${specifier}' imported from '${parentURL.href}'`)
}

async function readPackage(url) {
  try {
    return JSON.parse(await fs.readFile(url))
  } catch {
    return null
  }
}
