
import path from 'path'
import { partial } from 'underline'

import noop from './noop'
import spawn from './spawn'
import sf from './sf'

import mklog from './log'
const log = mklog('butler')

let self = {
  parse_butler_status: function (opts, onerror, token) {
    let onprogress = opts.onprogress || noop

    let status = JSON.parse(token)
    switch (status.type) {
      case 'log':
        return log(opts, `butler: ${status.message}`)
      case 'progress':
        return onprogress({percent: status.percentage})
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
      ontoken: self.parse_butler_status::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    return res
  },

  /* Extracts tar archive ${archive_path} into directory ${dest_path} */
  untar: async function (opts) {
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.archive_path === 'string'
      typeof opts.dest_path === 'string'
    }

    let {emitter, archive_path, dest_path} = opts
    let err = null
    let onerror = (e) => err = e

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'untar', archive_path, '-d', dest_path],
      ontoken: self.parse_butler_status::partial(opts, onerror),
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
      ontoken: self.parse_butler_status::partial(opts, onerror)
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
      ontoken: self.parse_butler_status::partial(opts, onerror)
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
      ontoken: self.parse_butler_status::partial(opts, onerror),
      emitter
    })

    if (err) { throw err }
    return res
  }
}

export default self
