# bare-build

Application builder for Bare that allows developers to package their JavaScript code as either native application bundles or standalone executables for both desktop and mobile.

```
npm i [-g] bare-build
```

## Usage

```js
const build = require('bare-build')

for await (const resource of build('/path/to/app.js', {
  base: '/path/to/',
  hosts: ['darwin-arm64', 'darwin-x64'],
  icon: 'icon.icns',
  identifier: 'com.example.App'
})) {
  console.log(resource)
}
```

```console
bare-build \
  --host darwin-arm64 --host darwin-x64 \
  --icon icon.icns \
  --identifier com.example.App \
  app.js
```

## Formats

| Platform | Unpackaged                 | `--package` | `--standalone`                                                |
| :------- | :------------------------- | :---------- | :------------------------------------------------------------ |
| Linux    | `.AppDir`, Snap compatible | `.AppImage` | ELF executable with self-extracting `.so` libraries           |
| Android  | `.apk`                     | `.aab`      | ELF executable with self-extracting `.so` libraries           |
| macOS    | `.app`                     | `.pkg`      | Mach-O executable with self-extracting `.framework` libraries |
| iOS      | `.app`                     | `.pkg`      | Mach-O executable with self-extracting `.framework` libraries |
| Windows  | Plain directory            | `.msix`     | PE executable with self-extracting `.dll` libraries           |

## API

#### `for await (const resource of build(entry[, preflight][, options]))`

Options include:

```js
options = {
  name: pkg.name,
  version: pkg.version,
  author: pkg.author,
  description: pkg.description,
  icon,
  identifier,
  manifest,
  resources,
  base: '.',
  hosts: [],
  out: '.',
  runtime,
  standalone: false,
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
  key,

  // Android signing options
  keystore,
  keystoreKey,
  keystorePassword
}
```

## CLI

#### `bare-build [flags] <entry>`

Flags include:

```console
--version|-v                     Print the current version
--name|-n <name>                 The application name
--author <name>                  The name of the application author
--description <text>             The description of the application
--icon|-i <path>                 The application icon
--identifier <id>                The unique application identifier
--manifest <path>                The platform specific application manifest
--resources <path>               The platform specific application resources
--base <path>                    The base path of the application (default: .)
--host <host>                    The host to target
--out|-o <dir>                   The output directory
--runtime <specifier>            The runtime to use
--standalone                     Build a standalone executable
--package                        Package the application for distribution
--sign                           Sign the application
--identity <id>                  The macOS signing identity
--application-identity <id>      The macOS application signing identity
--installer-identity <id>        The macOS installer signing identity
--keychain <name>                The macOS signing keychain
--entitlements <path>            The macOS signing entitlements
--hardened-runtime               Enable the macOS hardened runtime
--subject <id>                   The Windows signing subject
--subject-name <name>            The Windows signing subject friendly name
--thumbprint <sha1>              The Windows signing subject thumbprint
--key <hash>                     The GPG signing key
--keystore <path>                The Java-based keystore file
--keystore-key <name>            The name of the certificate to use from the keystore
--keystore-password <password>   The password to the keystore file
--help|-h                        Show help
```

## License

Apache-2.0
