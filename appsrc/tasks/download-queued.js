
import Promise from 'bluebird'
import {Cancelled, Transition} from './errors'

function start (opts) {
  let emitter = opts.emitter

  return new Promise((resolve, reject) => {
    emitter.once('shine', (t) => {
      reject(new Transition({
        to: 'download',
        reason: 'It\'s our time to shine.'
      }))
    })

    emitter.once('cancel', (t) => {
      reject(new Cancelled())
    })

    // we never resolve
  })
}

export default {start}
