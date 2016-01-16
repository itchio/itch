

let Promise = require('bluebird')
let Transition = require('./errors').Transition

function start (opts) {
  let emitter = opts.emitter

  return new Promise((resolve, reject) => {
    emitter.on('shine', t => {
      reject(new Transition({
        to: 'download',
        reason: `It's our time to shine.`
      }))
    })

    emitter.on('cancel', t => {
      reject(new Transition({
        to: 'idle',
        reason: `Nevermind then!`
      }))
    })

    // we never resolve (sic)
  })
}

module.exports = { start }
