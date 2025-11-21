#!/usr/bin/env node
const process = require('process')
const { command, arg, flag, summary } = require('paparam')
const pkg = require('./package')
const build = require('.')

const cmd = command(
  pkg.name,
  summary(pkg.description),
  arg('<entry>', 'The entry point of the app'),
  flag('--version|-v', 'Print the current version'),
  flag('--name|-n <name>', 'The application name'),
  flag('--author <name>', 'The name of the application author'),
  flag('--description <text>', 'The description of the application'),
  flag('--icon|-i <path>', 'The application icon'),
  flag('--identifier <id>', 'The unique application identifier'),
  flag('--target|-t <host>', 'The host to target').multiple(),
  flag('--out|-o <dir>', 'The output directory'),
  flag('--package', 'Package the application for distribution'),
  flag('--sign', 'Sign the application'),
  flag('--identity <id>', 'The macOS signing identity'),
  flag('--keychain <name>', 'The macOS signing keychain'),
  flag('--entitlements <path>', 'The macOS signing entitlements'),
  flag('--hardened-runtime', 'Enable the macOS hardened runtime'),
  flag('--subject <id>', 'The Windows signing subject'),
  flag('--subject-name <name>', 'The Windows signing subject friendly name'),
  flag('--thumbprint <sha1>', 'The Windows signing subject thumbprint'),
  flag('--key <hash>', 'The GPG signing key'),
  async (cmd) => {
    const { entry } = cmd.args
    const {
      version,
      name,
      author,
      description,
      icon,
      identifier,
      target,
      out,
      package,
      sign,
      identity,
      keychain,
      entitlements,
      hardenedRuntime,
      subject,
      subjectName,
      thumbprint,
      key
    } = cmd.flags

    if (version) return console.log(`v${pkg.version}`)

    try {
      await build(entry, {
        name,
        author,
        description,
        icon,
        identifier,
        target,
        out,
        package,
        sign,
        identity,
        keychain,
        entitlements,
        hardenedRuntime,
        subject,
        subjectName,
        thumbprint,
        key
      })
    } catch (err) {
      if (err) console.error(err)
      process.exitCode = 1
    }
  }
)

cmd.parse()
