const { spawn } = require('child_process')

module.exports = async function run(command, args, opts = {}) {
  const job = spawn(command, args, opts)

  return new Promise((resolve, reject) => {
    job.on('exit', (code) => {
      if (code === null || code !== 0)
        return reject(new Error(`Command '${command} ${args.join(' ')}' failed`))

      resolve()
    })
  })
}
