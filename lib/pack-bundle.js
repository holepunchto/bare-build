const { pathToFileURL } = require('url')
const traverse = require('bare-module-traverse')
const id = require('bare-bundle-id')
const pack = require('bare-pack')
const { readModule, listPrefix } = require('bare-pack/fs')

module.exports = async function packBundle(entry, opts, base) {
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
