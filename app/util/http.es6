
import path from 'path'
import {partial} from 'underscore'

import noop from './noop'
import spawn from './spawn'
import mkdirp from '../promised/mkdirp'

let self = {
  parse_butler_status: function (opts, token) {
    let {onprogress = noop} = opts

    let status = JSON.parse(token)
    if (status.Percent) {
      onprogress({percent: status.Percent})
    }
  },

  /*
   * Uses https://github.com/itchio/butler to download a file
   */
  request: function (opts) {
    let {url, dest} = opts

    return mkdirp(path.dirname(dest))
      .then(() => spawn({
        command: 'butler',
        args: ['dl', url, dest],
        ontoken: partial(self.parse_butler_status, opts)
      }))
  }
}

export default self
