const path = require('path')
const { pathToFileURL, fileURLToPath } = require('url')
const traverse = require('bare-module-traverse')
const resolve = require('bare-module-resolve')
const id = require('bare-bundle-id')
const pack = require('bare-pack')
const { readModule, listPrefix } = require('bare-pack/fs')
const host = require('#host')
const fs = require('./lib/fs')
const constants = require('./lib/constants')

module.exports = exports = async function* build(entry, preflight = null, opts = {}) {
  if (typeof preflight === 'object' && preflight !== null) {
    opts = preflight
    preflight = null
  }

  const { base = '.', hosts = [host] } = opts

  if (opts.standalone && opts.package) {
    throw new Error('Options `standalone` and `package` are mutually exclusive')
  }

  if (opts.standalone && preflight) {
    throw new Error('Option `preflight` is not supported in standalone mode')
  }

  let pkg
  try {
    pkg = require(path.resolve(base, 'package.json'))
  } catch {
    pkg = {}
  }

  opts.name ||= pkg.productName || pkg.name || 'App'
  opts.version ||= pkg.version || '1.0.0'
  opts.description ||= pkg.description || ''
  opts.author ||= pkg.author || ''

  if (typeof opts.runtime === 'string') {
    opts = { ...opts, runtime: await requireRelativeTo(opts.runtime, pathToFileURL(base + '/')) }
  }

  const entries = [entry, preflight].filter(Boolean).map((entry) => path.resolve(entry))

  // Linking only needs the entry points, so it doesn't wait for packing.
  entry = packBundle(entry, { hosts, linked: opts.standalone !== true }, base)
  entry.catch(noop)

  if (preflight) {
    preflight = packBundle(preflight, { hosts, linked: true }, base)
    preflight.catch(noop)
  }

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
      case 'android-arm64':
      case 'android-arm':
      case 'android-ia32':
      case 'android-x64':
        platform = require('./lib/platform/android')
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
    yield* platform(entries, entry, preflight, { ...opts, hosts })
  }
}

exports.constants = constants

async function packBundle(entry, opts, base) {
  const bundle = await pack(
    pathToFileURL(entry),
    { ...opts, resolve: traverse.resolve.bare },
    readModule,
    listPrefix
  )

  const unmounted = bundle.unmount(pathToFileURL(base))

  unmounted.id = id(unmounted).toString('hex')

  return unmounted
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

function noop() {}
