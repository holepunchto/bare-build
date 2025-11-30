const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const { PE } = require('bare-lief')
const fs = require('../../fs')
const { windows } = require('../../assets')
const prebuilds = require('../../prebuilds')
const sign = require('./sign')

module.exports = async function* createMSIXContentDirectory(base, bundle, host, out, opts = {}) {
  const { name, icon = windows.icon, runtime = { prebuilds } } = opts

  const app = path.resolve(out, name)

  const bin = path.join(app, 'App')
  await fs.makeDir(bin)

  const resources = path.join(app, 'Resources')
  await fs.makeDir(resources)

  const icons = path.join(app, 'Assets')
  await fs.makeDir(icons)

  const assets = path.join(resources, 'app')

  yield* link(base, { ...opts, hosts: [host], out: bin })

  const binary = new PE.Binary(await fs.readFile(runtime.prebuilds[host]()))

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

  const appBundle = path.join(resources, 'app.bundle')
  await fs.writeFile(appBundle, bundle.toBuffer())
  yield appBundle

  const appManifest = path.join(app, 'AppxManifest.xml')
  await fs.writeFile(appManifest, createAppxManifest(host, opts))
  yield appManifest

  const appIcon = path.join(icons, name + path.extname(icon))
  await fs.cp(path.resolve(icon), appIcon)
  yield appIcon

  yield app

  return app
}

// https://learn.microsoft.com/en-us/windows/msix/package/unsigned-package
const unsignedSubject = 'CN=AppModelSamples, OID.2.25.311729368913984317654407730594956997722=1'

function createAppxManifest(host, opts = {}) {
  let {
    name,
    identifier = toIdentifier(name),
    version,
    description,
    author,
    language = 'en-US',
    icon = windows.icon,
    subject = unsignedSubject
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

  version = version.match(/^\d+(\.\d+){0,2}/).at(0)

  const logo = `Assets\\${name}${path.extname(icon)}`

  return `\
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  xmlns:virtualization="http://schemas.microsoft.com/appx/manifest/virtualization/windows10"
  xmlns:desktop6="http://schemas.microsoft.com/appx/manifest/desktop/windows10/6"
  IgnorableNamespaces="rescap desktop6 virtualization"
>
  <Identity Name="${identifier}" Version="${version}.0" Publisher="${subject}" ProcessorArchitecture="${arch}" />
  <Properties>
    <DisplayName>${name}</DisplayName>
    <PublisherDisplayName>${author}</PublisherDisplayName>
    <Description>${description}</Description>
    <Logo>${logo}</Logo>
    <desktop6:RegistryWriteVirtualization>disabled</desktop6:RegistryWriteVirtualization>
    <desktop6:FileSystemWriteVirtualization>disabled</desktop6:FileSystemWriteVirtualization>
  </Properties>
  <Resources>
    <Resource Language="${language}" />
  </Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19045.0" MaxVersionTested="10.0.22621.0" />
    <PackageDependency Name="Microsoft.WindowsAppRuntime.1.4" MinVersion="4000.1049.117.0" Publisher="CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US" />
    <PackageDependency Name="Microsoft.VCLibs.140.00" MinVersion="14.0.30704.0" Publisher="CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US" />
  </Dependencies>
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
    <rescap:Capability Name="unvirtualizedResources" />
  </Capabilities>
  <Applications>
    <Application Id="App" Executable="App\\${name}.exe" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="${name}" Description="${description}" Square150x150Logo="${logo}" Square44x44Logo="${logo}" BackgroundColor="transparent" />
    </Application>
  </Applications>
</Package>
`
}

function toIdentifier(input) {
  return input.replace(/[^a-z0-9.-]+/gi, '')
}
