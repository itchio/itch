'use strict'

let path = require('path')
let partial = require('underscore').partial

let noop = require('./noop')
let spawn = require('./spawn')
let mkdirp = require('../promised/mkdirp')

let log = require('../util/log')('util/http')

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

  /*
   * Uses https://github.com/itchio/butler to download a file
   */
  request: async function (opts) {
    let emitter = opts.emitter
    let url = opts.url
    let dest = opts.dest
    let err = null
    let onerror = (e) => err = e

    await mkdirp(path.dirname(dest)) 
    let res = await spawn({
      command: 'butler',
      args: ['-j', 'dl', url, dest],
      ontoken: partial(self.parse_butler_status, opts, onerror),
      emitter
    })

    if (err) { throw err }
    return res
  }
}

module.exports = self
