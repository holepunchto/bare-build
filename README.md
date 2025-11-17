# bare-build

Application builder for Bare.

```
npm i [-g] bare-build
```

## Usage

```js
const build = require('bare-build')

await build('/path/to/app.js', {
  target: ['darwin-arm64', 'darwinx64'],
  icon: 'icon.icns',
  identifier: 'com.example.App'
})
```

```console
bare-build \
  --target darwin-arm64 --target darwin-x64 \
  --icon icon.icns \
  --identifier com.example.App \
  app.js
```

## API

#### `await build(entry[, options])`

Options include:

```js
options = {
  name: pkg.name,
  version: pkg.version,
  author: pkg.author,
  description: pkg.description,
  icon,
  identifier,
  target: [],
  out: '.',
  sign: false,

  // Apple signing options
  identity: 'Apple Development',
  keychain,
  entitlements,
  hardenedRuntime: false,

  // Windows signing options
  subject,
  subjectName,
  thumbprint,

  // Linux signing options
  key
}
```

## CLI

#### `bare-build [flags] <entry>`

Flags include:

```console
--name|-n <name>
--author <name>
--description <text>
--icon|-i <path>
--identifier <id>
--target|-t <host>
--out|-o <dir>
--sign
--identity <id>
--keychain <name>
--entitlements <path>
--hardened-runtime
--subject <id>
--subject-name <name>
--thumbprint <sha1>
--key <hash>
--help|-h
```

## License

Apache-2.0

```

```
