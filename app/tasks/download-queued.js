'use strict'

let Promise = require('bluebird')
let Transition = require('./errors').Transition

function start (opts) {
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
