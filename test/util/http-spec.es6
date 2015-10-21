import test from 'zopf'
import proxyquire from 'proxyquire'
import {EventEmitter} from 'events'

import electron from '../stubs/electron'

test('http', t => {
  let stub = Object.assign({
    pipe: () => { return stub }
  }, EventEmitter.prototype)
  let needle = {
    get: (opts) => stub
  }

  let stubs = Object.assign({
    'needle': needle
  }, electron)

  let http = proxyquire('../../app/util/http', stubs)

  let http_opts = {
    url: 'http://-invalid/hello.txt',
    sink: {},
    onprogress: () => {}
  }

  t.case('resolves on close', t => {
    setImmediate(() => { stub.emit('close') })
    return http.request(http_opts)
  })

  t.case('rejects errors', t => {
    setImmediate(() => { stub.emit('error', 'meow') })
    return t.rejects(http.request(http_opts))
  })

  t.case('progress', t => {
    t.mock(http_opts).expects('onprogress').withArgs({percent: 25})

    setImmediate(() => {
      stub.emit('headers', {'content-length': 512})
      let has_read = false
      let stream = {
        read: function () {
          if (!has_read) {
            has_read = true
            return new Buffer(128)
          }
        }
      }
      stub.listeners('readable').forEach((l) => l.apply(stream, []))
    })

    setTimeout(() => {
      stub.emit('end')
      stub.emit('close')
    }, 100)
    return http.request(http_opts)
  })
})
