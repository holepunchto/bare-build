const path = require('path')
const { pathToFileURL, fileURLToPath } = require('url')
const resolve = require('bare-module-resolve')
const host = require('#host')
const fs = require('./fs')

module.exports = async function resolveOptions(opts = {}) {
  const { base = '.', hosts = [host] } = opts

  let pkg
  try {
    pkg = require(path.resolve(base, 'package.json'))
  } catch {
    pkg = {}
  }

  opts = {
    ...opts,
    base,
    hosts,
    name: opts.name || pkg.productName || pkg.name || 'App',
    version: opts.version || pkg.version || '1.0.0',
    description: opts.description || pkg.description || '',
    author: opts.author || pkg.author || ''
  }

  if (typeof opts.runtime === 'string') {
    opts.runtime = await requireRelativeTo(opts.runtime, pathToFileURL(base + '/'))
  }

  return opts
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
