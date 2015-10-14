import test from 'zopf'
import proxyquire from 'proxyquire'

proxyquire.noPreserveCache()

let setup = (t, resolve) => {
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
    on: (ev, fn) => { handlers[ev] = fn },
    pipe: () => { return stub }
  }
  let mock = t.mock(request)
  mock.expects('get').once().returns(stub)

  return {request, http, handlers}
}

let http_opts = {
  url: 'http://-invalid/hello.txt',
  file: 'tmp/hello.txt',
  flags: 'w',
  headers: {},
  onprogress: () => {}
}

test('http completes', t => {
  let {http, handlers} = setup(t, true)

  setImmediate(() => { handlers.close() })
  return http.to_file(http_opts)
})

test('http rejects errors', t => {
  let {http, handlers} = setup(t, false)
  let spy = t.spy()

  setImmediate(() => { handlers.error('meow') })
  return http.to_file(http_opts).catch(spy).finally(() => {
    t.ok(spy.calledOnce)
  })
})
