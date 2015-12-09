
import path from 'path'
import {partial} from 'underscore'

import noop from './noop'
import spawn from './spawn'
import mkdirp from '../promised/mkdirp'

let log = require('../util/log')('util/http')

let self = {
  parse_butler_status: function (opts, onerror, token) {
    let {onprogress = noop} = opts

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
  request: function (opts) {
    let {url, dest} = opts
    let err = null
    let onerror = (e) => err = e

    return mkdirp(path.dirname(dest))
      .then(() => spawn({
        command: 'butler',
        args: ['-j', 'dl', url, dest],
        ontoken: partial(self.parse_butler_status, opts, onerror)
      })).then((res) => {
        if (err) { throw err }
        return res
      })
  }
}

export default self
