import test from 'zopf'
import proxyquire from 'proxyquire'

let setup = t => {
  let request = {
    get: (opts) => null
  }

  let stubs = {
    request,
    'request-progress': (t) => t,
    'app': {
      getVersion: () => '1.0',
      '@noCallThru': true
    }
  }

  let http = proxyquire('../app/util/http', stubs)

  let handlers = {}
  let stub = {
    on: function (ev, fn) {
      handlers[ev] = fn
    },
    pipe: function () { return stub }
  }
  let mock = t.mock(request)
  mock.expects('get').once().returns(stub)

  return {request, http, handlers}
}

let http_opts = {
  url: 'http://example.org/hello.txt',
  file: 'tmp/hello.txt',
  flags: 'w',
  headers: {}
}

test('http completes on close', t => {
  let {handlers, http} = setup(t)

  setImmediate(() => { handlers.close() })
  return http.to_file(http_opts)
})

test('http throws on error', t => {
  let {handlers, http} = setup(t)
  let spy = t.spy()

  setImmediate(() => {
    handlers.error('418 am a teapot amaa')
  })

  return http.to_file(http_opts).catch(spy).finally(() => {
    t.ok(spy.calledOnce)
  })
})
