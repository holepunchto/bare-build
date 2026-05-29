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

## Runtimes

`bare-build` ships with portable runtimes for all supported systems. Similarly to the `bare` CLI, the portable runtimes are designed to run only the I/O event loop of Bare and they're therefore mostly suited for standalone CLI applications. That's why we refer to them as portable; the same code will run the same way across all systems. For developing native GUI applications, however, the portable runtimes fall short as such applications require tight integration with the native event loop of the corresponding system, such as [`CFRunLoop`][cfrunloop] in Core Foundation or [`Looper`][looper] in Android. These applications must instead use a native runtime designed specifically for the system on which they're run.

[cfrunloop]: https://developer.apple.com/documentation/corefoundation/cfrunloop
[looper]: https://developer.android.com/reference/android/os/Looper

For that purpose, an alternative runtime can be specified via the `runtime` option or the `--runtime` flag. As with the portable runtimes, we maintain native runtimes for all supported systems.

| Platform | Runtime                                                     | API                               | CLI                              |
| :------- | :---------------------------------------------------------- | :-------------------------------- | :------------------------------- |
| Linux    | [bare-gtk](https://github.com/holepunchto/bare-gtk)         | `runtime: 'bare-gtk/runtime'`     | `--runtime bare-gtk/runtime`     |
| Android  | [bare-ndk](https://github.com/holepunchto/bare-ndk)         | `runtime: 'bare-ndk/runtime'`     | `--runtime bare-ndk/runtime`     |
| macOS    | [bare-app-kit](https://github.com/holepunchto/bare-app-kit) | `runtime: 'bare-app-kit/runtime'` | `--runtime bare-app-kit/runtime` |
| iOS      | [bare-ui-kit](https://github.com/holepunchto/bare-ui-kit)   | `runtime: 'bare-ui-kit/runtime'`  | `--runtime bare-ui-kit/runtime`  |
| Windows  | [bare-win-ui](https://github.com/holepunchto/bare-win-ui)   | `runtime: 'bare-win-ui/runtime'`  | `--runtime bare-win-ui/runtime`  |

### Embedded bundles

In `--standalone` mode, `bare-build` embeds the application bundle directly into the prebuilt executable. Custom runtimes must therefore expose a platform-specific anchor for the bundle that `bare-build` can locate and populate. The portable runtimes shipped with `bare-build` are good references for each platform.

| Platform        | Format | Anchor                                                     | Notes                                                                                                              |
| :-------------- | :----- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| Linux / Android | ELF    | Weak symbols `__bare_bundle_begin` and `__bare_bundle_end` | Declare as `extern char ...[] __attribute__((weak));`. `bare-build` adds a read-only segment and points them at it |
| macOS / iOS     | Mach-O | Segment `__BARE`, section `__bundle`                       | `bare-build` adds the segment to the executable; read with `getsectiondata(&_mh_execute_header, "__BARE", ...)`    |
| Windows         | PE     | Section `.bare`                                            | `bare-build` adds the section to the executable; locate it by iterating the section table at runtime               |

### Application identifier

In packaged mode on Linux, `bare-build` will optionally populate the `__bare_identifier` symbol with the value of `--identifier` if exposed by the runtime. This lets GTK runtimes pass the identifier to `gtk_application_new()` without recompiling. Declare it the same way as the bundle symbols:

```c
extern char __bare_identifier[] __attribute__((weak));
```

If the symbol is absent, `bare-build` leaves the executable untouched.

### Windows subsystem

On Windows, `bare-build` overwrites the PE `OptionalHeader.Subsystem` field of the prebuilt executable based on the packaging mode: `IMAGE_SUBSYSTEM_WINDOWS_CUI` for `--standalone` builds and `IMAGE_SUBSYSTEM_WINDOWS_GUI` for `--package` (MSIX) builds. Custom runtimes therefore can't lock in their own subsystem; link with either and `bare-build` will reset it to match the build mode.

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
  assetCatalog,
  iconName: 'AppIcon',
  identifier,
  infoPlist,
  androidManifest,
  appxManifest,
  desktopEntry,
  categories: ['Utility'],
  resources,
  compatibility,
  minimumVersion,
  targetVersion,
  language,
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
  provisioningProfile,
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
--config <path>                  Read configuration options from a module
--name|-n <name>                 The application name
--author <name>                  The name of the application author
--description <text>             The description of the application
--icon|-i <path>                 The application icon
--asset-catalog <path>           The Apple asset catalog
--icon-name <name>               The icon name within the Apple asset catalog
--identifier <id>                The unique application identifier
--info-plist <path>              The Apple Info.plist template
--android-manifest <path>        The Android manifest template
--appx-manifest <path>           The Windows AppxManifest.xml template
--desktop-entry <path>           The Linux desktop entry template
--category <name>                A Linux desktop entry category
--resources <path>               The Android resources directory
--compatibility <name>           Apply compatibility patches (choices: snap)
--minimum-version <version>      The minimum supported platform version
--target-version <version>       The target platform version
--language <code>                The Windows resource language code
--base <path>                    The base path of the application (default: .)
--host <host>                    The host to target
--out|-o <dir>                   The output directory
--runtime <specifier>            The runtime to use
--standalone                     Build a standalone executable
--package                        Package the application for distribution
--sign                           Sign the application
--identity <id>                  The Apple signing identity
--application-identity <id>      The Apple application signing identity
--installer-identity <id>        The Apple installer signing identity
--provisioning-profile <path>    The Apple provisioning profile
--keychain <name>                The Apple signing keychain
--entitlements <path>            The Apple signing entitlements
--hardened-runtime               Enable the Apple hardened runtime
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
