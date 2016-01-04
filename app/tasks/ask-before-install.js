
let Transition = require('./errors').Transition

function start (opts) {
  let emitter = opts.emitter

  return new Promise((resolve, reject) => {
    emitter.on('shine', t => {
      reject(new Transition({
        to: 'install',
        data: { has_user_blessing: true },
        reason: `Today is the day`
      }))
    })

    emitter.on('cancel', t => {
      reject(new Transition({
        to: 'idle',
        reason: `No shame in that`
      }))
    })
  })
}

module.exports = { start }
