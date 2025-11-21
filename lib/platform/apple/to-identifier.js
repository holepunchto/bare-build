// https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier
const invalidBundleIdentifierCharacter = /[^A-Za-z0-9.-]/g

module.exports = function toIdentifier(input) {
  return input.replace(invalidBundleIdentifierCharacter, '-')
}
