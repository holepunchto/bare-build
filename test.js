const test = require('brittle')
const path = require('path')
const build = require('.')
const { paths } = require('./test/helpers')

const fixtures = path.resolve(__dirname, 'test', 'fixtures')

test('app, darwin-arm64', async (t) => {
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
