
const Promise = require('bluebird')
const child_process = require('child_process')
const StreamSplitter = require('stream-splitter')
const LFTransform = require('./lf-transform')

const errors = require('../tasks/errors')

const log = require('./log')('spawn')

function spawn (opts) {
  pre: { // eslint-disable-line
    typeof opts === 'object'
    typeof opts.command === 'string'
    typeof opts.opts === 'object' || opts.opts === undefined
    Array.isArray(opts.args) || opts.args === undefined
    typeof opts.split === 'string' || opts.split === undefined
    typeof opts.ontoken === 'function' || opts.ontoken === undefined
    typeof opts.onerrtoken === 'function' || opts.onerrtoken === undefined
  }

  let emitter = opts.emitter
  let command = opts.command
  let spawn_opts = opts.opts || {}
  let args = opts.args || []
  let split = opts.split || '\n'

  log(opts, `spawning ${command} with args ${args.join(' ')}`)

  let child = child_process.spawn(command, args, spawn_opts)
  let cancelled = false

  if (opts.ontoken) {
    let splitter = child.stdout.pipe(new LFTransform()).pipe(StreamSplitter(split))
    splitter.encoding = 'utf8'
    splitter.on('token', opts.ontoken)
  }

  if (opts.onerrtoken) {
    let splitter = child.stderr.pipe(new LFTransform()).pipe(StreamSplitter(split))
    splitter.encoding = 'utf8'
    splitter.on('token', opts.onerrtoken)
  }

  return new Promise((resolve, reject) => {
    child.on('close', (code, signal) => {
      if (cancelled) {
        reject(new errors.Cancelled())
      } else {
        resolve(code)
      }
    })
    child.on('error', reject)

    if (emitter) {
      emitter.once('cancel', (e) => {
        try {
          cancelled = true
          child.kill('SIGKILL')
        } catch (e) {
          log(opts, `error while killing ${command}: ${e.stack || e}`)
        }
      })
    }
  })
}

module.exports = spawn
