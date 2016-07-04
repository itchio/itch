
import invariant from 'invariant'

import path from 'path'
import {partial} from 'underline'

import noop from './noop'
import spawn from './spawn'
import sf from './sf'

import mklog from './log'
const log = mklog('butler')

// TODO: DRY up those methods

const self = {
  parseButlerStatus: function (opts, onerror, token) {
    const {onProgress = noop} = opts

    let status
    try {
      status = JSON.parse(token)
    } catch (err) {
      log(opts, `Couldn't parse line of butler output: ${token}`)
    }
    switch (status.type) {
      case 'log':
        return log(opts, `butler: ${status.message}`)
      case 'progress':
        return onProgress({percent: status.percentage})
      case 'error':
        return onerror(status.message)
    }
  },

  /* Downloads file at ${url} to ${dest} */
  dl: async function (opts) {
    invariant(typeof opts === 'object', 'opts is object')
    invariant(typeof opts.url === 'string', 'opts.url is string')
    invariant(typeof opts.dest === 'string', 'opts.dest is string')

    let {emitter, url, dest} = opts
    let err = null
    let onerror = (e) => { err = e }

    await sf.mkdir(path.dirname(dest))
    let res = await spawn({
      command: 'butler',
      args: ['-j', 'dl', url, dest],
      onToken: self.parseButlerStatus::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    if (res !== 0) { throw new Error(`butler dl exited with code ${res}`) }
    return res
  },

  /* Apply a wharf patch at ${patchPath} in-place into ${outPath}, while checking with ${signaturePath} */
  apply: async function (opts) {
    invariant(typeof opts === 'object', 'opts is object')
    invariant(typeof opts.patchPath === 'string', 'opts.patchPath is string')
    invariant(typeof opts.outPath === 'string', 'opts.outPath is string')
    invariant(typeof opts.signaturePath === 'string', 'opts.signaturePath is string')

    let {emitter, patchPath, outPath, signaturePath} = opts
    let err = null
    let onerror = (e) => { err = e }

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'apply', patchPath, '--inplace', outPath, '--signature', signaturePath],
      onToken: self.parseButlerStatus::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    if (res !== 0) { throw new Error(`butler apply exited with code ${res}`) }
    return res
  },

  /* Extracts tar archive ${archivePath} into directory ${destPath} */
  untar: async function (opts) {
    invariant(typeof opts === 'object', 'opts is object')
    invariant(typeof opts.archivePath === 'string', 'opts.archivePath is string')
    invariant(typeof opts.outPath === 'string', 'opts.outPath is string')

    let {emitter, archivePath, destPath} = opts
    let err = null
    let onerror = (e) => { err = e }

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'untar', archivePath, '-d', destPath],
      onToken: self.parseButlerStatus::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    if (res !== 0) { throw new Error(`butler untar exited with code ${res}`) }
    return res
  },

  /* rm -rf ${path} */
  wipe: async function (path, opts = {}) {
    invariant(typeof path === 'string', 'wipe has string path')

    let err = null
    let onerror = (e) => { err = e }

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'wipe', path],
      onToken: self.parseButlerStatus::partial(opts, onerror)
    })

    if (err) { throw err }
    if (res !== 0) { throw new Error(`butler wipe exited with code ${res}`) }
    return res
  },

  /* mkdir -p ${path} */
  mkdir: async function (path, opts = {}) {
    invariant(typeof path === 'string', 'mkdir has string path')

    let err = null
    let onerror = (e) => { err = e }

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'mkdir', path],
      onToken: self.parseButlerStatus::partial(opts, onerror)
    })

    if (err) { throw err }
    if (res !== 0) { throw new Error(`butler mkdir exited with code ${res}`) }
    return res
  },

  /* rsync -a ${src} ${dst} */
  ditto: async function (src, dst, opts = {}) {
    invariant(typeof src === 'string', 'ditto has string src')
    invariant(typeof dst === 'string', 'ditto has string dst')
    let err = null
    let onerror = (e) => { err = e }
    let emitter = opts.emitter

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'ditto', src, dst],
      onToken: self.parseButlerStatus::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    if (res !== 0) { throw new Error(`butler ditto exited with code ${res}`) }
    return res
  }
}

export default self
