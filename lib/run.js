const { spawn } = require('child_process')

module.exports = async function run(command, args, opts = {}) {
  const job = spawn(command, args, opts)
  const err = []

  job.stderr.on('data', (data) => err.push(data))

  return new Promise((resolve, reject) => {
    job.on('close', (code) => {
      if (code === null || code !== 0) {
        return reject(
          new Error(`Command '${command} ${args.join(' ')}' failed`, {
            cause: Buffer.concat(err).toString().trim()
          })
        )
      }

      resolve()
    })
  })
}
