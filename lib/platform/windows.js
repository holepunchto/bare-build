const path = require('path')
const link = require('bare-link')
const unpack = require('bare-unpack')
const fs = require('../fs')
const run = require('../run')
const prebuilds = require('../prebuilds')

module.exports = async function build(base, pkg, bundle, opts = {}) {
  const { hosts = [], out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'win32-arm64':
        arch = 'arm64'
        break
      case 'win32-x64':
        arch = 'x64'
        break
      default:
        throw new Error(`Unknown host '${host}'`)
    }

    archs.set(arch, host)
  }

  const result = []

  for (const [arch, host] of archs) {
    result.push(
      await appx(base, pkg, bundle, {
        ...opts,
        host,
        out: archs.size === 1 ? path.resolve(out) : path.resolve(out, arch)
      })
    )
  }

  return result
}

async function appx(base, pkg, bundle, opts = {}) {
  const { name = pkg.name, icon, host, out = '.' } = opts

  const tmp = await fs.tempDir()

  const app = path.join(tmp, name)

  const bin = path.join(app, 'App')
  await fs.makeDir(bin)

  const executable = path.join(bin, name + '.exe')

  await fs.copyFile(prebuilds[host](), executable)

  await sign(executable, opts)

  const resources = path.join(app, 'Resources')
  await fs.makeDir(resources)

  const assets = path.join(resources, 'app')

  for await (const resource of link(base, { hosts: [host], out: bin })) {
    await sign(resource, opts)
  }

  bundle = await unpack(bundle, { files: false, assets: true }, async (key) => {
    const target = path.join(assets, key)

    await fs.makeDir(path.dirname(target))
    await fs.writeFile(target, bundle.read(key))

    return '/../app' + key
  })

  await fs.writeFile(path.join(resources, 'app.bundle'), bundle.toBuffer())

  await fs.writeFile(path.join(app, 'AppxManifest.xml'), appxManifest(pkg, host, opts))

  const icons = path.join(app, 'Assets')
  await fs.makeDir(icons)

  await fs.cp(path.resolve(icon), path.join(icons, name + path.extname(icon)))

  const appx = path.resolve(out, name + '.msix')

  await fs.rm(appx)

  await run('makeappx', ['pack', '/d', app, '/p', appx])

  await sign(appx, opts)

  return appx
}

async function sign(resource, opts = {}) {
  const { sign = false, subjectName, thumbprint } = opts

  if (sign) {
    const args = ['sign', '/a', '/fd', 'SHA256', '/t', 'http://timestamp.digicert.com']

    if (subjectName) args.push('/n', subjectName)
    if (thumbprint) args.push('/sha1', thumbprint)

    args.push(resource)

    await run('signtool', args)
  }
}

// https://learn.microsoft.com/en-us/windows/msix/package/unsigned-package
const unsignedSubject = 'CN=AppModelSamples, OID.2.25.311729368913984317654407730594956997722=1'

function appxManifest(pkg, host, opts = {}) {
  let {
    name = pkg.name,
    identifier = toIdentifier(name),
    version = pkg.version,
    description = pkg.description,
    author = pkg.author,
    language = 'en-US',
    icon,
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
