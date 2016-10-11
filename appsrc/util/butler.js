
import invariant from 'invariant'

import path from 'path'
import {partial} from 'underline'

import noop from './noop'
import spawn from './spawn'
import sf from './sf'

import mklog from './log'
const log = mklog('butler')

const fakeNetworkTroubles = (process.env.TCP_OVER_TROUBLED_WATERS === '1')
const showDebug = (process.env.MY_BUTLER_IS_MY_FRIEND === '1')
const dumpAllOutput = (process.env.MY_BUTLER_IS_MY_ENEMY === '1')

let troubleCounter = 0

function parseButlerStatus (opts, onerror, token) {
  const {onProgress = noop} = opts

  if (dumpAllOutput) {
    console.log(`butler: ${token}`)
  }

  let status
  try {
    status = JSON.parse(token)
  } catch (err) {
    log(opts, `Couldn't parse line of butler output: ${token}`)
  }

  switch (status.type) {
    case 'log': {
      if (!showDebug && status.level === 'debug') {
        return
      }
      return log(opts, `butler: ${status.message}`)
    }
    case 'progress': {
      if (fakeNetworkTroubles && opts.url && opts.emitter) {
        troubleCounter += Math.random()
        if (troubleCounter > 250) {
          troubleCounter = 0
          log(opts, 'butler: faking network troubles!')
          onerror('unexpected EOF')
          opts.emitter.emit('fake-close', {code: 1})
          return
        }
      }
      return onProgress({percent: status.percentage})
    }
    case 'error': {
      return onerror(status.message)
    }
  }
}

async function butler (opts, command, commandArgs) {
  invariant(typeof command === 'string', 'command is a string')
  invariant(Array.isArray(commandArgs), 'commandArgs is an array')

  const {emitter} = opts
  const onerror = (e) => { err = e }
  let err = null

  const args = [ '--json', command, ...commandArgs ]

  const onToken = parseButlerStatus::partial(opts, onerror)

  const res = await spawn({
    command: 'butler',
    args,
    onToken,
    emitter
  })

  if (err) { throw err }
  if (res !== 0) { throw new Error(`butler ${command} exited with code ${res}`) }
  return res
}

/* Copy file ${src} to ${dest} */
async function cp (opts) {
  invariant(typeof opts === 'object', 'opts is object')
  invariant(typeof opts.src === 'string', 'opts.src is string')
  invariant(typeof opts.dest === 'string', 'opts.dest is string')

  const {src, dest} = opts
  const args = [src, dest]
  if (opts.resume) {
    args.push('--resume')
  }

  return await butler(opts, 'cp', args)
}

/* Downloads file at ${url} to ${dest} */
async function dl (opts) {
  invariant(typeof opts === 'object', 'opts is object')
  invariant(typeof opts.url === 'string', 'opts.url is string')
  invariant(typeof opts.dest === 'string', 'opts.dest is string')

  const {url, dest} = opts
  const args = [url, dest]

  await sf.mkdir(path.dirname(dest))
  return await butler(opts, 'dl', args)
}

/* Apply a wharf patch at ${patchPath} in-place into ${outPath}, while checking with ${signaturePath} */
async function apply (opts) {
  invariant(typeof opts === 'object', 'opts is object')
  invariant(typeof opts.patchPath === 'string', 'opts.patchPath is string')
  invariant(typeof opts.outPath === 'string', 'opts.outPath is string')
  invariant(typeof opts.signaturePath === 'string', 'opts.signaturePath is string')

  const {patchPath, outPath, signaturePath} = opts
  const args = [patchPath, '--inplace', outPath, '--signature', signaturePath]

  return await butler(opts, 'apply', args)
}

/* Extracts tar archive ${archivePath} into directory ${destPath} */
async function untar (opts) {
  invariant(typeof opts === 'object', 'opts is object')
  invariant(typeof opts.archivePath === 'string', 'opts.archivePath is string')
  invariant(typeof opts.destPath === 'string', 'opts.destPath is string')

  const {archivePath, destPath} = opts
  const args = [archivePath, '-d', destPath]

  return await butler(opts, 'untar', args)
}

/* Extracts zip archive ${archivePath} into directory ${destPath} */
async function unzip (opts) {
  invariant(typeof opts === 'object', 'opts is object')
  invariant(typeof opts.archivePath === 'string', 'opts.archivePath is string')
  invariant(typeof opts.destPath === 'string', 'opts.destPath is string')

  const {archivePath, destPath} = opts
  const args = [archivePath, '-d', destPath]

  return await butler(opts, 'unzip', args)
}

/* rm -rf ${path} */
async function wipe (path, opts = {}) {
  invariant(typeof path === 'string', 'wipe has string path')

  const args = [path]
  return await butler(opts, 'wipe', args)
}

/* mkdir -p ${path} */
async function mkdir (path, opts = {}) {
  invariant(typeof path === 'string', 'mkdir has string path')

  const args = [path]
  return await butler(opts, 'mkdir', args)
}

/* rsync -a ${src} ${dst} */
async function ditto (src, dst, opts = {}) {
  invariant(typeof src === 'string', 'ditto has string src')
  invariant(typeof dst === 'string', 'ditto has string dst')

  const args = [src, dst]
  return await butler(opts, 'ditto', args)
}

async function sanityCheck () {
  try {
    const res = await spawn({
      command: 'butler',
      args: ['--version']
    })
    return res === 0
  } catch (err) {
    return false
  }
}

export default {
  cp, dl, apply, untar, unzip, wipe, mkdir, ditto, sanityCheck
}
