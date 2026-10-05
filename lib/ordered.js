const os = require('os')

// Yields in the order of `generators`, whichever finishes first.
module.exports = async function* ordered(generators, concurrency = os.availableParallelism()) {
  const waiting = []

  let active = 0

  const results = generators.map((generator) => drain(generator))

  for (const result of results) result.catch(noop)

  for (const result of results) yield* await result

  async function drain(generator) {
    if (active < concurrency) active++
    else await new Promise((resolve) => waiting.push(resolve))

    try {
      const values = []

      for await (const value of generator) values.push(value)

      return values
    } finally {
      const next = waiting.shift()

      if (next) next()
      else active--
    }
  }
}

function noop() {}
