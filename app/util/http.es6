
import Promise from 'bluebird'
import app from 'app'
import assign from 'object-assign'

// this module is typically used to download large
// binary files, so we use the vanilla request lib
// instead of request-promise
import request from 'request'
import progress from 'request-progress'

import fstream from 'fstream'

let default_headers = {
  'User-Agent': `itchio-app/${app.getVersion()}`
}

let self = {
  to_file: function (opts) {
    let {url, file, flags, headers, onprogress} = opts
    headers = assign({}, default_headers, headers)

    let req = progress(request.get({ encoding: null, url, headers }))
    req.on('progress', onprogress)

    let out = req.pipe(fstream.Writer({ path: file, flags }))

    return new Promise((resolve, reject) => {
      req.on('error', reject)
      out.on('close', resolve)
    })
  }
}

export default self
