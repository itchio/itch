
let default_opts = {
  throttle: 50
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

  req.on('readable', function () {
    let chunk
    while ((chunk = this.read())) {
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
    }
  })

  req.on('end', () => {
    done = true
  })

  return req
}
