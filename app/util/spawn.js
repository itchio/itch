'use strict'

let Promise = require('bluebird')
let child_process = require('child_process')
let StreamSplitter = require('stream-splitter')

let noop = require('./noop')

let log = require('./log')('spawn')

function spawn (opts) {
  if (typeof opts === 'undefined') {
    opts = {}
  }

  let emitter = opts.emitter
  let command = opts.command
  let args = opts.args || []
  let split = opts.split || '\n'
  let ontoken = opts.ontoken || noop
  log(opts, `spawning ${command} with args ${args.join(' ')}`)

  let child = child_process.spawn(command, args)

  if (emitter) {
    emitter.on('cancel', (e) => {
      try {
        child.kill('SIGKILL')
        emitter.emit('cancelled', {comment: `Very dead, Mr. Spock.`})
      } catch (e) {
        log(opts, `error while killing ${command}: ${e.stack || e}`)
      }
    })
  }

  let splitter = child.stdout.pipe(StreamSplitter(split))
  splitter.encoding = 'utf8'
  splitter.on('token', ontoken)

  return new Promise((resolve, reject, onCancel) => {
    child.on('close', resolve)
    child.on('error', reject)
  })
}

module.exports = spawn
