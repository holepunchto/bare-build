const path = require('path')
const fs = require('fs')
const os = require('os')

exports.rm = async function rm(name) {
  return new Promise((resolve, reject) => {
    fs.rm(name, { force: true, recursive: true }, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.cp = async function cp(src, dest) {
  return new Promise((resolve, reject) => {
    fs.cp(src, dest, { force: true, recursive: true, verbatimSymlinks: true, filter }, (err) => {
      err ? reject(err) : resolve()
    })
  })

  function filter(src, dest) {
    switch (path.basename(src)) {
      case 'node_modules':
      case 'build':
      case 'prebuilds':
        return false
    }

    return true
  }
}

exports.chmod = async function chmod(name, mode) {
  return new Promise((resolve, reject) => {
    fs.chmod(name, mode, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.copyFile = async function copyFile(src, dest) {
  return new Promise((resolve, reject) => {
    fs.copyFile(src, dest, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.writeFile = async function writeFile(name, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(name, data, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.readFile = async function readFile(name) {
  return new Promise((resolve) => {
    fs.readFile(name, (err, data) => {
      resolve(err ? null : data)
    })
  })
}

exports.symlink = async function symlink(target, path) {
  await exports.rm(path)

  return new Promise((resolve, reject) => {
    fs.symlink(target, path, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.makeDir = async function makeDir(name) {
  return new Promise((resolve, reject) => {
    fs.mkdir(name, { recursive: true }, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.tempDir = async function tempDir() {
  const name = Math.random().toString(16).slice(2)

  return new Promise((resolve, reject) => {
    fs.realpath(os.tmpdir(), (err, dir) => {
      if (err) return reject(err)

      dir = path.join(dir, `bare-build-${name}`)

      fs.mkdir(dir, { recursive: true }, (err) => {
        err ? reject(err) : resolve(dir)
      })
    })
  })
}
