module.exports = function groupHosts(hosts, platforms) {
  const groups = new Map()

  for (const host of hosts) {
    const platform = platforms[toPlatform(host)]

    let group = groups.get(platform)

    if (group === undefined) {
      group = []
      groups.set(platform, group)
    }

    group.push(host)
  }

  return groups
}

function toPlatform(host) {
  switch (host) {
    case 'darwin-arm64':
    case 'darwin-x64':
    case 'ios-arm64':
    case 'ios-arm64-simulator':
    case 'ios-x64-simulator':
      return 'apple'
    case 'android-arm64':
    case 'android-arm':
    case 'android-ia32':
    case 'android-x64':
      return 'android'
    case 'linux-arm64':
    case 'linux-x64':
      return 'linux'
    case 'win32-arm64':
    case 'win32-x64':
      return 'windows'
    default:
      throw new Error(`Unknown host '${host}'`)
  }
}
