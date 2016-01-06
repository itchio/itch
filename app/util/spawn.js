
let Promise = require('bluebird')
let child_process = require('child_process')
let StreamSplitter = require('stream-splitter')
let LFTransform = require('./lf-transform')

let log = require('./log')('spawn')

function spawn (opts) {
  if (typeof opts === 'undefined') {
    opts = {}
  }

  let emitter = opts.emitter
  let command = opts.command
  let spawn_opts = opts.opts || {}
  let args = opts.args || []
  let split = opts.split || '\n'

  log(opts, `spawning ${command} with args ${args.join(' ')}`)

  let child = child_process.spawn(command, args, spawn_opts)

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

  if (opts.ontoken) {
    let splitter = child.stdout.pipe(LFTransform()).pipe(StreamSplitter(split))
    splitter.encoding = 'utf8'
    splitter.on('token', opts.ontoken)
  }

  if (opts.onerrtoken) {
    let splitter = child.stderr.pipe(LFTransform()).pipe(StreamSplitter(split))
    splitter.encoding = 'utf8'
    splitter.on('token', opts.onerrtoken)
  }

  return new Promise((resolve, reject, onCancel) => {
    child.on('close', resolve)
    child.on('error', reject)
  })
}

module.exports = spawn
