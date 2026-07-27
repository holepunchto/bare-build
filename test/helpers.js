const path = require('path')
const { spawn } = require('child_process')

exports.paths = function paths(list) {
  return list.map(path.normalize)
}

exports.run = function run(command, args = []) {
  return new Promise((resolve, reject) => {
    const subprocess = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })

    const stdout = []
    const stderr = []

    subprocess.stdout.on('data', (data) => stdout.push(data))
    subprocess.stderr.on('data', (data) => stderr.push(data))

    subprocess.on('error', reject)

    subprocess.on('close', (code) =>
      resolve({
        code,
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString()
      })
    )
  })
}
