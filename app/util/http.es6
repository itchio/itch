
import Promise from 'bluebird'

import needle from 'needle'

import progress from './needle-progress'
import noop from './noop'

let self = {
  request: function (opts) {
    let {url, sink, headers = {}, onprogress = noop} = opts

    let req = needle.get(url, {
      headers,
      decode_response: false,
      parse_response: false
    })
    req = progress(req)
    req.on('progress', onprogress)

    let out = req.pipe(sink)

    return new Promise((resolve, reject) => {
      req.on('error', reject)
      out.on('close', resolve)
    })
  }
}

export default self
