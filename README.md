# bare-build

Application builder for Bare.

```
npm i [-g] bare-build
```

## Usage

```js
const build = require('bare-build')

for await (const resource of build('/path/to/app.js', {
  target: ['darwin-arm64', 'darwin-x64'],
  icon: 'icon.icns',
  identifier: 'com.example.App'
})) {
  console.log(resource)
}
```

```console
bare-build \
  --target darwin-arm64 --target darwin-x64 \
  --icon icon.icns \
  --identifier com.example.App \
  app.js
```

## API

#### `for await (const resource of build(entry[, options]))`

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
  package: false,
  sign: false,

  // Apple signing options
  identity: 'Apple Development',
  applicationIdentity: identity,
  installerIdentity: identity,
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
--version|-v                  Print the current version
--name|-n <name>              The application name
--author <name>               The name of the application author
--description <text>          The description of the application
--icon|-i <path>              The application icon
--identifier <id>             The unique application identifier
--target|-t <host>            The host to target
--out|-o <dir>                The output directory
--package                     Package the application for distribution
--sign                        Sign the application
--identity <id>               The macOS signing identity
--application-identity <id>   The macOS application signing identity
--installer-identity <id>     The macOS installer signing identity
--keychain <name>             The macOS signing keychain
--entitlements <path>         The macOS signing entitlements
--hardened-runtime            Enable the macOS hardened runtime
--subject <id>                The Windows signing subject
--subject-name <name>         The Windows signing subject friendly name
--thumbprint <sha1>           The Windows signing subject thumbprint
--key <hash>                  The GPG signing key
--help|-h                     Show help
```

## License

Apache-2.0
