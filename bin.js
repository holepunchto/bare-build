#!/usr/bin/env node
const process = require('process')
const { command, arg, flag, summary } = require('paparam')
const pkg = require('./package')
const build = require('.')

const cmd = command(
  pkg.name,
  summary(pkg.description),
  arg('<entry>', 'The entry point of the app'),
  arg('[preflight]', 'The optional preflight entry point of the app'),
  flag('--version|-v', 'Print the current version'),
  flag('--name|-n <name>', 'The application name'),
  flag('--author <name>', 'The name of the application author'),
  flag('--description <text>', 'The description of the application'),
  flag('--icon|-i <path>', 'The application icon'),
  flag('--identifier <id>', 'The unique application identifier'),
  flag('--manifest <path>', 'The platform specific application manifest'),
  flag('--resources <path>', 'The platform specific application resources'),
  flag('--base <path>', 'The base path of the application').default('.'),
  flag('--target|-t <host>', 'The host to target').multiple(),
  flag('--out|-o <dir>', 'The output directory'),
  flag('--runtime <specifier>', 'The runtime to use'),
  flag('--standalone', 'Build a standalone executable'),
  flag('--package', 'Package the application for distribution'),
  flag('--sign', 'Sign the application'),
  flag('--identity <id>', 'The macOS signing identity'),
  flag('--application-identity <id>', 'The macOS application signing identity'),
  flag('--installer-identity <id>', 'The macOS installer signing identity'),
  flag('--keychain <name>', 'The macOS signing keychain'),
  flag('--entitlements <path>', 'The macOS signing entitlements'),
  flag('--hardened-runtime', 'Enable the macOS hardened runtime'),
  flag('--subject <id>', 'The Windows signing subject'),
  flag('--subject-name <name>', 'The Windows signing subject friendly name'),
  flag('--thumbprint <sha1>', 'The Windows signing subject thumbprint'),
  flag('--key <hash>', 'The GPG signing key'),
  flag('--keystore <path>', 'The Java-based keystore file'),
  flag('--keystore-key <name>', 'The name of the certificate to use from the keystore'),
  flag('--keystore-password <password>', 'The password to the keystore file'),
  async (cmd) => {
    const { entry, preflight } = cmd.args
    let {
      version,
      name,
      author,
      description,
      icon,
      identifier,
      base,
      target,
      out,
      runtime,
      standalone,
      package,
      sign,
      identity,
      applicationIdentity,
      installerIdentity,
      keychain,
      entitlements,
      hardenedRuntime,
      subject,
      subjectName,
      thumbprint,
      key,
      keystore,
      keystoreKey,
      keystorePassword
    } = cmd.flags

    if (version) return console.log(`v${pkg.version}`)

    try {
      for await (const _ of build(entry, preflight, {
        name,
        author,
        description,
        icon,
        identifier,
        base,
        target,
        out,
        runtime,
        standalone,
        package,
        sign,
        identity,
        applicationIdentity,
        installerIdentity,
        keychain,
        entitlements,
        hardenedRuntime,
        subject,
        subjectName,
        thumbprint,
        key,
        keystore,
        keystoreKey,
        keystorePassword
      })) {
      }
    } catch (err) {
      if (err) console.error(err)
      process.exitCode = 1
    }
  }
)

cmd.parse()
