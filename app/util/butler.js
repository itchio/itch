
let path = require('path')
let partial = require('underscore').partial

let noop = require('./noop')
let spawn = require('./spawn')
let sf = require('./sf')

let log = require('../util/log')('butler')

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
    let emitter = opts.emitter
    let url = opts.url
    let dest = opts.dest
    let err = null
    let onerror = (e) => err = e

    await sf.mkdir(path.dirname(dest))
    let res = await spawn({
      command: 'butler',
      args: ['-j', 'dl', url, dest],
      ontoken: partial(self.parse_butler_status, opts, onerror),
      emitter
    })

    if (err) { throw err }
    return res
  },

  /* Extracts tar archive ${archive_path} into directory ${dest_path} */
  untar: async function (opts) {
    let emitter = opts.emitter
    let archive_path = opts.archive_path
    let dest_path = opts.dest_path
    let err = null
    let onerror = (e) => err = e

    let res = await spawn({
      command: 'butler',
      args: ['-j', 'untar', archive_path, '-d', dest_path],
      ontoken: partial(self.parse_butler_status, opts, onerror),
      emitter
    })

    if (err) { throw err }
    return res
  }
}

module.exports = self
