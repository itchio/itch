import test from 'zopf'
import proxyquire from 'proxyquire'
import {PassThrough} from 'stream'

import electron from '../stubs/electron'

let get_http_opts = function () {
  let sink = new PassThrough()
  sink.on('data', () => null)
  sink.on('end', () => sink.emit('close'))
  return {
    url: 'http://-invalid/hello.txt',
    sink,
    onprogress: () => {},
    throttle: 0
  }
}

test('http', t => {
  let tube

  let needle = {
    get: (opts) => {
      return (tube = new PassThrough())
    }
  }

  let stubs = Object.assign({
    'needle': needle
  }, electron)

  let http = proxyquire('../../app/util/http', stubs)

  t.case('resolves on close', t => {
    let http_opts = get_http_opts()
    setImmediate(() => {
      tube.end()
    })
    return http.request(http_opts)
  })

  t.case('rejects errors', t => {
    setImmediate(() => { tube.emit('error', 'meow') })
    return t.rejects(http.request(get_http_opts()))
  })

  t.case('progress', t => {
    let http_opts = get_http_opts()
    t.mock(http_opts).expects('onprogress').withArgs({percent: 25})

    setImmediate(() => {
      tube.emit('headers', {'content-length': 512})
      tube.write(new Buffer(64))
    })

    setImmediate(() => {
      tube.write(new Buffer(64))
    })

    setTimeout(() => {
      tube.end()
    }, 20)
    return http.request(http_opts)
  })
})
