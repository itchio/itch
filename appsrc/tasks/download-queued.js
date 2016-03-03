
import Promise from 'bluebird'
import errors from './errors'

function start (opts) {
  let emitter = opts.emitter

  return new Promise((resolve, reject) => {
    emitter.once('shine', t => {
      reject(new errors.Transition({
        to: 'download',
        reason: `It's our time to shine.`
      }))
    })

    emitter.once('cancel', t => {
      reject(new errors.Cancelled())
    })

    // we never resolve
  })
}

export default { start }
