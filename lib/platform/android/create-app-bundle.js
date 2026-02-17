const path = require('path')
const link = require('bare-link')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')

module.exports = async function* createAppBundle(base, bundle, hosts, out, opts = {}) {
  const { createAppBundle, constants } = require('bare-apk') // Optional

  const {
    name,
    identifier = toIdentifier(name),
    manifest,
    resources,
    minimumVersion = constants.DEFAULT_MINIMUM_SDK,
    targetVersion = constants.DEFAULT_TARGET_SDK,
    runtime = { prebuilds }
  } = opts

  const archs = new Map()

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'android-arm64':
        arch = 'arm64-v8a'
        break
      case 'android-arm':
        arch = 'armeabi-v7a'
        break
      case 'android-ia32':
        arch = 'x86'
        break
      case 'android-x64':
        arch = 'x86_64'
        break
      default:
        throw new Error(`Unknown host '${host}'`)
    }

    archs.set(arch, host)
  }

  const temp = await fs.tempDir()

  try {
    const lib = path.join(temp, 'lib')
    await fs.makeDir(lib)

    const assets = path.join(temp, 'assets')
    await fs.makeDir(assets)

    const classes = path.join(temp, 'dex')
    await fs.makeDir(classes)

    yield* link(base, { ...opts, hosts, out: lib })

    for (const [arch, host] of archs) {
      const prebuild = runtime.prebuilds[host]()

      try {
        for await (const file of await fs.openDir(
          path.resolve(prebuild, '..', path.basename(prebuild, '.so').replace(/^lib/, ''))
        )) {
          switch (path.extname(file.name)) {
            case '.so': {
              const so = path.join(lib, arch, file.name)
              await fs.copyFile(path.join(file.parentPath, file.name), so)
              yield so
              break
            }
            case '.dex': {
              const dex = path.join(classes, file.name)
              await fs.copyFile(path.join(file.parentPath, file.name), dex)
              yield dex
              break
            }
          }
        }
      } catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') throw err
      }

      const so = path.join(lib, arch, path.basename(prebuild))
      await fs.copyFile(prebuild, so)
      yield so
    }

    const appBundle = path.join(assets, 'app.bundle')
    await fs.writeFile(appBundle, bundle.toBuffer())
    yield appBundle

    const appManifest = path.join(temp, 'AndroidManifest.xml')

    if (manifest) {
      await fs.copyFile(path.resolve(manifest), appManifest)
    } else {
      await fs.writeFile(
        appManifest,
        createAndroidManifest(name, identifier, minimumVersion, targetVersion)
      )
    }

    yield appManifest

    const aab = path.join(out, name + '.aab')
    await createAppBundle(appManifest, aab, { include: [lib, assets, classes], resources })
    yield aab

    return aab
  } finally {
    await fs.rm(temp)
  }
}

function createAndroidManifest(name, identifier, minimumVersion, targetVersion) {
  return `\
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" android:versionCode="1" android:versionName="1.0" package="${identifier}">
  <uses-sdk android:minSdkVersion="${minimumVersion}" android:targetSdkVersion="${targetVersion}" />
  <application android:label="${name}">
    <activity android:name="to.holepunch.bare.Activity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>
`
}

function toIdentifier(input) {
  return input.replace(/[^a-z0-9_]+/gi, '_')
}
