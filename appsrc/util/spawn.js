
import Promise from 'bluebird'
import childProcess from 'child_process'
import StreamSplitter from 'stream-splitter'
import LFTransform from './lf-transform'

import {Cancelled} from '../tasks/errors'

import mklog from './log'
const log = mklog('spawn')

function spawn (opts) {
  pre: { // eslint-disable-line
    typeof opts === 'object'
    typeof opts.command === 'string'
    typeof opts.opts === 'object' || opts.opts === undefined
    Array.isArray(opts.args) || opts.args === undefined
    typeof opts.split === 'string' || opts.split === undefined
    typeof opts.onToken === 'function' || opts.onToken === undefined
    typeof opts.onErrToken === 'function' || opts.onErrToken === undefined
  }

  let emitter = opts.emitter
  let command = opts.command
  let spawnOpts = opts.opts || {}
  let args = opts.args || []
  let split = opts.split || '\n'

  log(opts, `spawning ${command} with args ${args.join(' ')}`)

  let child = childProcess.spawn(command, args, spawnOpts)
  let cancelled = false
  let cbErr = null

  if (opts.onToken) {
    let splitter = child.stdout.pipe(new LFTransform()).pipe(StreamSplitter(split))
    splitter.encoding = 'utf8'
    splitter.on('token', (tok) => {
      try {
        opts.onToken(tok)
      } catch (err) {
        cbErr = err
      }
    })
  }

  if (opts.onErrToken) {
    let splitter = child.stderr.pipe(new LFTransform()).pipe(StreamSplitter(split))
    splitter.encoding = 'utf8'
    splitter.on('token', (tok) => {
      try {
        opts.onToken(tok)
      } catch (err) {
        cbErr = err
      }
    })
  }

  return new Promise((resolve, reject) => {
    child.on('close', (code, signal) => {
      if (cbErr) {
        reject(cbErr)
      }
      if (cancelled) {
        reject(new Cancelled())
      } else {
        if (code === null && signal) {
          reject(new Error(`killed by signal ${signal}`))
        }
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

export default spawn
