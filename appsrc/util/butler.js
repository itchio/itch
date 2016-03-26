
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

    const status = JSON.parse(token)
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
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.url === 'string'
      typeof opts.dest === 'string'
    }

    let {emitter, url, dest} = opts
    let err = null
    let onerror = (e) => err = e

    await sf.mkdir(path.dirname(dest))
    let res = await spawn({
      command: 'butler',
      args: ['-j', 'dl', url, dest],
      onToken: self.parseButlerStatus::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    return res
  },

  /* Extracts tar archive ${archivePath} into directory ${destPath} */
  untar: async function (opts) {
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.archivePath === 'string'
      typeof opts.destPath === 'string'
    }

    let {emitter, archivePath, destPath} = opts
    let err = null
    let onerror = (e) => err = e

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'untar', archivePath, '-d', destPath],
      onToken: self.parseButlerStatus::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    return res
  },

  /* rm -rf ${path} */
  wipe: async function (path, opts = {}) {
    let err = null
    let onerror = (e) => err = e

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'wipe', path],
      onToken: self.parseButlerStatus::partial(opts, onerror)
    })

    if (err) { throw err }
    return res
  },

  /* mkdir -p ${path} */
  mkdir: async function (path, opts = {}) {
    pre: { // eslint-disable-line
      typeof path === 'string'
    }

    let err = null
    let onerror = (e) => err = e

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'mkdir', path],
      onToken: self.parseButlerStatus::partial(opts, onerror)
    })

    if (err) { throw err }
    return res
  },

  /* rsync -a ${src} ${dst} */
  ditto: async function (src, dst, opts = {}) {
    pre: { // eslint-disable-line
      typeof src === 'string'
      typeof dst === 'string'
    }
    let err = null
    let onerror = (e) => err = e
    let emitter = opts.emitter

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'ditto', src, dst],
      onToken: self.parseButlerStatus::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    return res
  }
}

export default self
