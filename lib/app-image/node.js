// Node.js has no platform conditions and `bare-app-image` only installs on Linux.
module.exports = process.platform === 'linux' ? require('bare-app-image') : require('./unsupported')
