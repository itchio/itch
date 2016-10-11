
const PassThrough = require('stream').PassThrough

let defaultOpts = {
  throttle: 250
}

export default function (req, userOpts) {
  if (typeof userOpts === 'undefined') {
    userOpts = {}
  }

  let timeout = null
  let total_size = 0
  let received_size = 0
  let done = false

  let opts = Object.assign({}, defaultOpts, userOpts)
  let throttle = opts.throttle

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
        progress: Math.round(received_size / total_size)
      })
    }, throttle)
  })

  clean_pipe.on('end', () => {
    done = true
  })

  return req
}
