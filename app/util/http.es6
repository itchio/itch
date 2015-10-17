
import Promise from 'bluebird'
import app from 'app'

// this module is typically used to download large
// binary files, so we use the vanilla request lib
// instead of request-promise
import request from 'request'
import progress from 'request-progress'

import noop from './noop'

let default_headers = {
  'User-Agent': `itchio-app/${app.getVersion()}`
}

let self = {
  request: function (opts) {
    let {url, sink, headers = {}, onprogress = noop} = opts
    headers = Object.assign({}, default_headers, headers)

    let req = progress(request.get({ encoding: null, url, headers }))
    let out = req.pipe(sink)

    return new Promise((resolve, reject) => {
      req.on('progress', onprogress)
      req.on('response', (response) => {
        if (!/^2/.test('' + response.statusCode)) {
          reject(`HTTP ${response.statusCode} while accessing ${url}`)
        }
      })
      req.on('error', reject)

      out.on('close', resolve)
    })
  }
}

export default self
