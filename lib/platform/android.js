const path = require('path')
const link = require('bare-link')
const fs = require('../fs')
const prebuilds = require('../prebuilds')

module.exports = async function* android(base, bundle, preflight, opts = {}) {
  const { createAppBundle, createAPK, constants } = require('bare-apk') // Optional

  const {
    hosts = [],
    name,
    identifier = toIdentifier(name),
    minimumSDK = constants.DEFAULT_MINIMUM_SDK,
    targetSDK = constants.DEFAULT_TARGET_SDK,
    runtime = { prebuilds },
    standalone = false,
    package = false,
    out = '.'
  } = opts

  if (standalone) {
    throw new Error('Standalone mode is not supported for Android')
  }

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

  const temp = []

  try {
    const build = await fs.tempDir()

    temp.push(build)

    const lib = path.join(build, 'lib')
    await fs.makeDir(lib)

    yield* link(base, { ...opts, hosts, out: lib })

    const assets = path.join(build, 'assets')
    await fs.makeDir(assets)

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
            }
          }
        }
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
      }

      const so = path.join(lib, arch, path.basename(prebuild))
      await fs.copyFile(prebuild, so)
      yield so
    }

    const appBundle = path.join(assets, 'app.bundle')
    await fs.writeFile(appBundle, bundle.toBuffer())
    yield appBundle

    const appManifest = path.join(build, 'AndroidManifest.xml')
    await fs.writeFile(appManifest, createAndroidManifest(name, identifier, minimumSDK, targetSDK))
    yield appManifest

    const aab = path.join(package ? out : build, name + '.aab')
    await createAppBundle(appManifest, aab, { include: [lib, assets] })
    yield aab

    if (package) return [aab]

    const apk = path.join(out, name + '.apk')
    await createAPK(aab, apk, opts)
    yield apk

    return [apk]
  } finally {
    for (const dir of temp) await fs.rm(dir)
  }
}

function createAndroidManifest(name, identifier, minimumSDK, targetSDK) {
  return `\
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" android:versionCode="1" android:versionName="1.0" package="${identifier}">
  <uses-sdk android:minSdkVersion="${minimumSDK}" android:targetSdkVersion="${targetSDK}" />
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <application android:label="${name}" android:hasCode="false">
    <activity android:name="android.app.NativeActivity" android:configChanges="orientation|keyboardHidden" android:exported="true">
      <meta-data android:name="android.app.lib_name" android:value="bare" />
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
