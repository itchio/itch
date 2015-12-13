'use strict'

let Promise = require('bluebird')
let Transition = require('./errors').Transition

function start (opts) {
  console.log(`download-queue got opts:\n${JSON.stringify(opts, null, 2)}`)

  return new Promise((resolve, reject) => {
    opts.emitter.on('shine', t => {
      reject(new Transition({
        to: 'download',
        reason: `It's our time to shine.`
      }))
    })

    // we never resolve (sic)
  })
}

module.exports = { start }
