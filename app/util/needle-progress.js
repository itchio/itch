'use nodent';'use strict'

import {PassThrough} from 'stream'

let default_opts = {
  throttle: 250
}

export default function (req, user_opts = {}) {
  let timeout = null
  let total_size = 0
  let received_size = 0
  let done = false

  let opts = Object.assign({}, default_opts, user_opts)
  let {throttle} = opts

  req.on('headers', (headers) => {
    total_size = headers['content-length']
  })

  let clean_pipe = new PassThrough({objectMode: false})
  req.pipe(clean_pipe)

  clean_pipe.on('readable', function () {
    let chunk = this.read()
    if (!chunk) return

    received_size += chunk.length

    if (timeout) return

    timeout = setTimeout(() => {
      timeout = null
      if (done) return
      if (total_size === 0) return

      req.emit('progress', {
        percent: Math.round(received_size / total_size * 100)
      })
    }, throttle)
  })

  clean_pipe.on('end', () => {
    done = true
  })

  return req
}
