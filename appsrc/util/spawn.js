
import invariant from 'invariant'

import Promise from 'bluebird'
import childProcess from 'child_process'
import StreamSplitter from 'stream-splitter'
import LFTransform from './lf-transform'

import {Cancelled} from '../tasks/errors'

import mklog from './log'
const log = mklog('spawn')

function spawn (opts) {
  const {emitter, command, args = [], split = '\n', onToken, onErrToken} = opts
  const spawnOpts = opts.opts || {}

  invariant(typeof command === 'string', 'spawn needs string command')
  invariant(typeof spawnOpts === 'object', 'spawn needs object opts')
  invariant(Array.isArray(args), 'spawn needs args array')
  invariant(typeof split === 'string', 'spawn needs string split')
  invariant(typeof onToken === 'function' || onToken === undefined, 'spawn needs onToken to be a function')
  invariant(typeof onErrToken === 'function' || onErrToken === undefined, 'spawn needs onErrToken to be a function')

  log(opts, `spawning ${command} with args ${args.join(' ')}`)

  const child = childProcess.spawn(command, args, spawnOpts)
  let cancelled = false
  let cbErr = null

  if (onToken) {
    const splitter = child.stdout.pipe(new LFTransform()).pipe(StreamSplitter(split))
    splitter.encoding = 'utf8'
    splitter.on('token', (tok) => {
      try {
        onToken(tok)
      } catch (err) {
        cbErr = err
      }
    })
  }

  if (onErrToken) {
    const splitter = child.stderr.pipe(new LFTransform()).pipe(StreamSplitter(split))
    splitter.encoding = 'utf8'
    splitter.on('token', (tok) => {
      try {
        onErrToken(tok)
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

spawn.exec = async function (opts) {
  let out = ''
  let err = ''

  const {onToken, onErrToken} = opts

  const actualOpts = {
    ...opts,
    onToken: (tok) => {
      out += tok + '\n'
      if (onToken) { onToken(tok) }
    },
    onErrToken: (tok) => {
      err += tok + '\n'
      if (onErrToken) { onErrToken(tok) }
    }
  }

  const code = await spawn(actualOpts)
  return {code, out, err}
}

spawn.getOutput = async function (opts) {
  const {code, err, out} = await spawn.exec(opts)
  const {command} = opts

  if (code !== 0) {
    log(opts, `${command} failed:\n${err}`)
    throw new Error(`${command} failed with code ${code}`)
  }

  return out.trim()
}

spawn.escapePath = function (arg) {
  return `"${arg.replace(/"/g, '\\"')}"`
}

export default spawn
