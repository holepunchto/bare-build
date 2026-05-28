const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const { PE } = require('bare-lief')
const tpl = require('bare-tpl')
const fs = require('../../fs')
const { windows } = require('../../assets')
const prebuilds = require('../../prebuilds')
const { type } = require('../../constants')
const sign = require('./sign')

const { EXECUTABLE } = type

module.exports = async function* createMSIXContentDirectory(
  base,
  bundle,
  preflight,
  host,
  out,
  opts = {}
) {
  const {
    name,
    identifier = toIdentifier(name),
    version,
    icon = windows.icon,
    description,
    author,
    language = 'en-US',
    subject = unsignedSubject,
    minimumVersion = '10.0.19045.0',
    targetVersion = '10.0.22621.0',
    manifest,
    runtime = { prebuilds }
  } = opts

  let arch

  switch (host) {
    case 'win32-arm64':
      arch = 'arm64'
      break
    case 'win32-x64':
      arch = 'x64'
      break
  }

  const app = path.resolve(out, name)

  const bin = path.join(app, 'App')
  await fs.makeDir(bin)

  const icons = path.join(app, 'Assets')
  await fs.makeDir(icons)

  const assets = path.join(bin, 'app')

  yield* link(base, { ...opts, hosts: [host], out: bin })

  const { type, path: prebuild, dependencies = [] } = runtime.prebuilds[host]()

  if (type !== EXECUTABLE) {
    throw new Error(`Prebuild for '${host}' must be an executable`)
  }

  for (const dependency of dependencies) {
    const name = path.basename(dependency)

    switch (path.extname(name)) {
      case '.dll': {
        const dll = path.join(bin, name)
        await fs.copyFile(dependency, dll)
        await sign(dll, opts)
        yield dll
      }
    }
  }

  const binary = new PE.Binary(await fs.readFile(prebuild))

  binary.optionalHeader.subsystem = PE.OptionalHeader.SUBSYSTEM.WINDOWS_GUI

  const executable = path.join(bin, name + '.exe')
  binary.toDisk(executable)
  await sign(executable, opts)
  yield executable

  const unpacked = []

  bundle = await unpack(bundle, { files: false, assets: true }, async (key) => {
    const target = path.join(assets, key)

    await fs.makeDir(path.dirname(target))
    await fs.writeFile(target, bundle.read(key))

    unpacked.push(target)

    return '/../app' + key
  })

  yield* unpacked

  const appBundle = path.join(bin, 'app.bundle')
  await fs.writeFile(appBundle, bundle.toBuffer())
  yield appBundle

  if (preflight) {
    const preflightBundle = path.join(bin, 'preflight.bundle')
    await fs.writeFile(preflightBundle, preflight.toBuffer())
    yield preflightBundle
  }

  const appManifest = path.join(app, 'AppxManifest.xml')

  const variables = {
    name,
    identifier,
    version: version.match(/^\d+(\.\d+){0,2}/).at(0) + '.0',
    description,
    author,
    language,
    logo: `Assets\\${name}${path.extname(icon)}`,
    executable: `App\\${name}.exe`,
    arch,
    subject,
    minimumVersion,
    targetVersion
  }

  if (manifest) {
    await fs.writeFile(
      appManifest,
      tpl.render(await fs.readFile(path.resolve(manifest)), variables)
    )
  } else {
    await fs.writeFile(appManifest, createAppxManifest(variables))
  }

  yield appManifest

  const appIcon = path.join(icons, name + path.extname(icon))
  await fs.cp(path.resolve(icon), appIcon)
  yield appIcon

  yield app

  return app
}

// https://learn.microsoft.com/en-us/windows/msix/package/unsigned-package
const unsignedSubject = 'CN=AppModelSamples, OID.2.25.311729368913984317654407730594956997722=1'

function createAppxManifest(opts) {
  const {
    name,
    identifier,
    version,
    description,
    author,
    language,
    logo,
    executable,
    arch,
    subject,
    minimumVersion,
    targetVersion
  } = opts

  return `\
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="rescap"
>
  <Identity Name="${identifier}" Version="${version}" Publisher="${subject}" ProcessorArchitecture="${arch}" />
  <Properties>
    <DisplayName>${name}</DisplayName>
    <PublisherDisplayName>${author}</PublisherDisplayName>
    <Description>${description}</Description>
    <Logo>${logo}</Logo>
  </Properties>
  <Resources>
    <Resource Language="${language}" />
  </Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="${minimumVersion}" MaxVersionTested="${targetVersion}" />
  </Dependencies>
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
  <Applications>
    <Application Id="App" Executable="${executable}" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="${name}" Description="${description}" Square150x150Logo="${logo}" Square44x44Logo="${logo}" BackgroundColor="transparent" />
    </Application>
  </Applications>
</Package>
`
}

function toIdentifier(input) {
  return input.replace(/[^a-z0-9.-]+/gi, '')
}
