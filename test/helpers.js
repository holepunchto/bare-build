const path = require('path')

exports.paths = function paths(list) {
  return list.map(path.normalize)
}
