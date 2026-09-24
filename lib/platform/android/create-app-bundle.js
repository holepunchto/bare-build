const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const tpl = require('bare-tpl')
const { Version } = require('bare-semver')
const fs = require('../../fs')
const prebuilds = require('../../prebuilds')
const { type } = require('../../constants')

const { SHARED_LIBRARY } = type

module.exports = async function* createAppBundle(base, bundle, preflight, hosts, out, opts = {}) {
  const { createAppBundle, constants } = require('bare-apk') // Optional

  const {
    name,
    identifier = toIdentifier(name),
    version,
    description,
    author,
    resources,
    minimumVersion = constants.DEFAULT_MINIMUM_SDK,
    targetVersion = constants.DEFAULT_TARGET_SDK,
    androidManifest,
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

    const staging = path.join(temp, 'staging')
    await fs.makeDir(staging)

    const runtimeClasses = []
    const addonClasses = []

    for await (const resource of link(base, { ...opts, hosts, out: lib })) {
      switch (path.extname(resource)) {
        case '.so': {
          yield resource
          break
        }
        case '.dex': {
          const dex = path.join(staging, `addon-${addonClasses.length}.dex`)
          await fs.renameFile(resource, dex)
          addonClasses.push(dex)
          break
        }
        case '.jar': {
          await fs.rm(resource)
          break
        }
      }
    }

    const seen = new Set()

    for (const [arch, host] of archs) {
      const { type, path: prebuild, dependencies = [] } = runtime.prebuilds[host]()

      if (type !== SHARED_LIBRARY) {
        throw new Error(`Prebuild for '${host}' must be a shared library`)
      }

      await fs.makeDir(path.join(lib, arch))

      for (const dependency of dependencies) {
        const name = path.basename(dependency)

        switch (path.extname(name)) {
          case '.so': {
            const so = path.join(lib, arch, name)
            await fs.copyFile(dependency, so)
            yield so
            break
          }
          case '.dex': {
            // DEX files aren't architecture specific, yet they're duplicated
            // across the per-architecture prebuild directories. We therefore
            // need to deduplicate them.
            if (seen.has(name)) continue
            seen.add(name)
            const dex = path.join(staging, `runtime-${runtimeClasses.length}.dex`)
            await fs.copyFile(dependency, dex)
            runtimeClasses.push(dex)
            break
          }
        }
      }

      const so = path.join(lib, arch, path.basename(prebuild))
      await fs.copyFile(prebuild, so)
      yield so
    }

    const written = []

    // An archive numbers its DEX files `classes.dex`, `classes2.dex` and so on
    // with no gaps, and loads the first before anything else has run, which is
    // why the runtime's come first.
    for (const source of [...runtimeClasses, ...addonClasses]) {
      const contents = await fs.readFile(source)

      // A package reachable by more than one path is walked more than once, and
      // the same classes twice over is not the archive that was meant.
      if (written.some((seen) => seen.equals(contents))) continue

      written.push(contents)

      const dex = path.join(
        classes,
        written.length === 1 ? 'classes.dex' : `classes${written.length}.dex`
      )

      await fs.writeFile(dex, contents)
      yield dex
    }

    const unpacked = []

    bundle = await unpack(bundle, { files: false, assets: true }, async (key) => {
      const target = path.join(assets, 'app', key)

      await fs.makeDir(path.dirname(target))
      await fs.writeFile(target, bundle.read(key))

      unpacked.push(target)

      return 'asset:/app' + key
    })

    yield* unpacked

    const appBundle = path.join(assets, 'app.bundle')
    await fs.writeFile(appBundle, bundle.toBuffer())
    yield appBundle

    if (preflight) {
      const preflightBundle = path.join(assets, 'preflight.bundle')
      await fs.writeFile(preflightBundle, preflight.toBuffer())
      yield preflightBundle
    }

    const androidManifestPath = path.join(temp, 'AndroidManifest.xml')

    const { major, minor, patch } = Version.parse(version)

    const variables = {
      name,
      identifier,
      activity: 'to.holepunch.bare.Activity',
      version: `${major}.${minor}.${patch}`,
      versionCode: major * 1000000 + minor * 1000 + patch,
      description,
      author,
      icon: resources ? '@mipmap/ic_launcher' : null,
      minimumVersion,
      targetVersion
    }

    if (androidManifest) {
      await fs.writeFile(
        androidManifestPath,
        tpl.render(await fs.readFile(path.resolve(androidManifest)), variables)
      )
    } else {
      await fs.writeFile(androidManifestPath, createAndroidManifest(variables))
    }

    yield androidManifestPath

    const aab = path.join(out, name + '.aab')
    await createAppBundle(androidManifestPath, aab, { include: [lib, assets, classes], resources })
    yield aab

    return aab
  } finally {
    await fs.rm(temp)
  }
}

// A Bare application draws its own interface, so it handles every configuration
// change itself rather than letting one destroy and recreate the activity.
const CONFIG_CHANGES = [
  'density',
  'fontScale',
  'keyboard',
  'keyboardHidden',
  'layoutDirection',
  'locale',
  'mcc',
  'mnc',
  'navigation',
  'orientation',
  'screenLayout',
  'screenSize',
  'smallestScreenSize',
  'touchscreen',
  'uiMode'
].join('|')

function createAndroidManifest(opts) {
  const { name, identifier, activity, version, versionCode, icon, minimumVersion, targetVersion } =
    opts

  return `\
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" android:versionCode="${versionCode}" android:versionName="${version}" package="${identifier}">
  <uses-sdk android:minSdkVersion="${minimumVersion}" android:targetSdkVersion="${targetVersion}" />
  <application android:label="${name}"${icon ? ` android:icon="${icon}"` : ''}>
    <activity android:name="${activity}" android:exported="true" android:configChanges="${CONFIG_CHANGES}">
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
