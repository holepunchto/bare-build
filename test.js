const test = require('brittle')
const path = require('path')
const { isMac, isLinux } = require('which-runtime')
const build = require('.')
const { paths } = require('./test/helpers')

const fixtures = path.resolve(__dirname, 'test', 'fixtures')

test('basic, darwin-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'basic', 'app.js'), {
    out,
    base: path.join(fixtures, 'basic'),
    hosts: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.app/Contents/MacOS/My App',
      'My App.app/Contents/Info.plist',
      'My App.app/Contents/PkgInfo',
      'My App.app/Contents/Resources/app.bundle',
      'My App.app/Contents/Resources/app.png',
      'My App.app'
    ])
  )
})

test('basic, darwin-arm64, preflight', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(
    path.join(fixtures, 'basic', 'app.js'),
    path.join(fixtures, 'basic', 'preflight.js'),
    {
      out,
      base: path.join(fixtures, 'basic'),
      hosts: ['darwin-arm64']
    }
  )) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.app/Contents/MacOS/My App',
      'My App.app/Contents/Info.plist',
      'My App.app/Contents/PkgInfo',
      'My App.app/Contents/Resources/app.bundle',
      'My App.app/Contents/Resources/preflight.bundle',
      'My App.app/Contents/Resources/app.png',
      'My App.app'
    ])
  )
})

test('basic, darwin-arm64, package', { skip: !isMac }, async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'basic', 'app.js'), {
    out,
    base: path.join(fixtures, 'basic'),
    package: true,
    hosts: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result.slice(-1), paths(['My App.pkg']))
})

test('basic, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'basic', 'app.js'), {
    out,
    base: path.join(fixtures, 'basic'),
    hosts: ['ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.app/My App',
      'My App.app/Info.plist',
      'My App.app/PkgInfo',
      'My App.app/app.bundle',
      'My App.app/app.png',
      'My App.app'
    ])
  )
})

test('basic, ios-arm64, preflight', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(
    path.join(fixtures, 'basic', 'app.js'),
    path.join(fixtures, 'basic', 'preflight.js'),
    {
      out,
      base: path.join(fixtures, 'basic'),
      hosts: ['ios-arm64']
    }
  )) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.app/My App',
      'My App.app/Info.plist',
      'My App.app/PkgInfo',
      'My App.app/app.bundle',
      'My App.app/preflight.bundle',
      'My App.app/app.png',
      'My App.app'
    ])
  )
})

test('basic, ios-arm64, package', { skip: !isMac }, async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'basic', 'app.js'), {
    out,
    base: path.join(fixtures, 'basic'),
    package: true,
    hosts: ['ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result.slice(-1), paths(['My App.pkg']))
})

test('basic, linux-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'basic', 'app.js'), {
    out,
    base: path.join(fixtures, 'basic'),
    hosts: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.AppDir/usr/bin/my-app',
      'My App.AppDir/usr/share/applications/My App.desktop',
      'My App.AppDir/usr/share/my-app/app.bundle',
      'My App.AppDir/usr/share/icons/My App.png',
      'My App.AppDir'
    ])
  )
})

test('basic, linux-arm64, preflight', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(
    path.join(fixtures, 'basic', 'app.js'),
    path.join(fixtures, 'basic', 'preflight.js'),
    {
      out,
      base: path.join(fixtures, 'basic'),
      hosts: ['linux-arm64']
    }
  )) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.AppDir/usr/bin/my-app',
      'My App.AppDir/usr/share/applications/My App.desktop',
      'My App.AppDir/usr/share/my-app/app.bundle',
      'My App.AppDir/usr/share/my-app/preflight.bundle',
      'My App.AppDir/usr/share/icons/My App.png',
      'My App.AppDir'
    ])
  )
})

test('basic, linux-arm64, package', { skip: !isLinux }, async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'basic', 'app.js'), {
    out,
    base: path.join(fixtures, 'basic'),
    package: true,
    hosts: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result.slice(-1), paths(['My App.AppImage']))
})

test('basic, win32-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'basic', 'app.js'), {
    out,
    base: path.join(fixtures, 'basic'),
    hosts: ['win32-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App/App/My App.exe',
      'My App/Resources/app.bundle',
      'My App/AppxManifest.xml',
      'My App/Assets/My App.png',
      'My App'
    ])
  )
})

test('basic, win32-arm64, preflight', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(
    path.join(fixtures, 'basic', 'app.js'),
    path.join(fixtures, 'basic', 'preflight.js'),
    {
      out,
      base: path.join(fixtures, 'basic'),
      hosts: ['win32-arm64']
    }
  )) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App/App/My App.exe',
      'My App/Resources/app.bundle',
      'My App/Resources/preflight.bundle',
      'My App/AppxManifest.xml',
      'My App/Assets/My App.png',
      'My App'
    ])
  )
})

test('addon, darwin-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'addon', 'app.js'), {
    out,
    base: path.join(fixtures, 'addon'),
    hosts: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.app/Contents/Frameworks/bare-os.3.9.1.framework/Versions/A/bare-os.3.9.1',
      'My App.app/Contents/Frameworks/bare-os.3.9.1.framework/Versions/A/Resources/Info.plist',
      'My App.app/Contents/Frameworks/bare-os.3.9.1.framework',
      'My App.app/Contents/MacOS/My App',
      'My App.app/Contents/Info.plist',
      'My App.app/Contents/PkgInfo',
      'My App.app/Contents/Resources/app.bundle',
      'My App.app/Contents/Resources/app.png',
      'My App.app'
    ])
  )
})

test('addon, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'addon', 'app.js'), {
    out,
    base: path.join(fixtures, 'addon'),
    hosts: ['ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.app/Frameworks/bare-os.3.9.1.framework/bare-os.3.9.1',
      'My App.app/Frameworks/bare-os.3.9.1.framework/Info.plist',
      'My App.app/Frameworks/bare-os.3.9.1.framework',
      'My App.app/My App',
      'My App.app/Info.plist',
      'My App.app/PkgInfo',
      'My App.app/app.bundle',
      'My App.app/app.png',
      'My App.app'
    ])
  )
})

test('addon, linux-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'addon', 'app.js'), {
    out,
    base: path.join(fixtures, 'addon'),
    hosts: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App.AppDir/usr/lib/libbare-os.3.9.1.so',
      'My App.AppDir/usr/bin/my-app',
      'My App.AppDir/usr/share/applications/My App.desktop',
      'My App.AppDir/usr/share/my-app/app.bundle',
      'My App.AppDir/usr/share/icons/My App.png',
      'My App.AppDir'
    ])
  )
})

test('addon, win32-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of build(path.join(fixtures, 'addon', 'app.js'), {
    out,
    base: path.join(fixtures, 'addon'),
    hosts: ['win32-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'My App/App/bare-os-3.9.1.dll',
      'My App/App/My App.exe',
      'My App/Resources/app.bundle',
      'My App/AppxManifest.xml',
      'My App/Assets/My App.png',
      'My App'
    ])
  )
})
