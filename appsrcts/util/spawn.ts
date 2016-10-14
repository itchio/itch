
import * as invariant from 'invariant'

import * as bluebird from 'bluebird'
import * as childProcess from 'child_process'
import * as StreamSplitter from 'stream-splitter'
import LFTransform from './lf-transform'

import { Cancelled } from '../tasks/errors'

import mklog from './log'
const log = mklog('spawn')

import { EventEmitter } from 'events'

interface SpawnOpts {
  command: string
  args: Array<string>
  split?: string
  emitter?: EventEmitter
  onToken?: (token: string) => void
  onErrToken?: (token: string) => void
  opts?: any
}

interface ExecResult {
  code: number
  out: string
  err: string
}

interface SpawnInterface {
  (opts: SpawnOpts): Promise<number>
  exec(opts: SpawnOpts): Promise<ExecResult>
  getOutput(opts: SpawnOpts): Promise<string>
  escapePath(arg: string): string
}

var spawn: SpawnInterface

spawn = async function (opts: SpawnOpts): Promise<number> {
  const {emitter, command, args = [], split = '\n', onToken, onErrToken} = opts

  invariant(typeof command === 'string', 'spawn needs string command')
  invariant(Array.isArray(args), 'spawn needs args array')
  invariant(typeof split === 'string', 'spawn needs string split')
  invariant(typeof onToken === 'function' || onToken === undefined, 'spawn needs onToken to be a function')
  invariant(typeof onErrToken === 'function' || onErrToken === undefined, 'spawn needs onErrToken to be a function')

  const spawnOpts = Object.assign({}, opts.opts || {}, {
    stdio: [
      'ignore', // stdin
      onToken ? 'pipe' : 'ignore', // stdout
      onErrToken ? 'pipe' : 'ignore' // stderr
    ]
  })

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

  const promise = new bluebird((resolve, reject) => {
    let fakeCode

    child.on('close', (code, signal) => {
      if (!code && fakeCode) {
        code = fakeCode
        signal = null
      }

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
      emitter.once('fake-close', (e) => {
        try {
          child.kill('SIGTERM')
          fakeCode = e.code
        } catch (e) {
          log(opts, `error while terminating ${command}: ${e.stack || e}`)
        }
      })
    }
  })
  const code = (await promise) as number
  return code
} as any

spawn.exec = async function (opts: SpawnOpts): Promise<ExecResult> {
  let out = ''
  let err = ''

  const {onToken, onErrToken} = opts

  const actualOpts = Object.assign({}, opts, {
    onToken: (tok) => {
      out += tok + '\n'
      if (onToken) { onToken(tok) }
    },
    onErrToken: (tok) => {
      err += tok + '\n'
      if (onErrToken) { onErrToken(tok) }
    }
  })

  const code = await spawn(actualOpts)
  return { code, out, err }
}

spawn.getOutput = async function (opts: SpawnOpts): Promise<string> {
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
