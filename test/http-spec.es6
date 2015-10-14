import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'

import electron from './stubs/electron'

let setup = (t, resolve) => {
  let request = {
    get: (opts) => null
  }

  let stubs = assign({
    request,
    'request-progress': (t) => t
  }, electron)

  let http = proxyquire('../app/util/http', stubs)

  let handlers = {}
  let stub = {
    on: (ev, fn) => { handlers[ev] = fn },
    pipe: () => { return stub }
  }
  let mock = t.mock(request)
  mock.expects('get').once().returns(stub)

  return assign({request, http, handlers}, electron)
}

let http_opts = {
  url: 'http://-invalid/hello.txt',
  sink: {},
  onprogress: () => {}
}

test('http completes', t => {
  let {http, handlers} = setup(t, true)

  setImmediate(() => { handlers.close() })
  return http.request(http_opts)
})

test('http rejects non-2xx response', t => {
  let {http, handlers} = setup(t, false)

  setImmediate(() => { handlers.response({statusCode: 404}) })
  return t.rejects(http.request(http_opts))
})

test('http rejects errors', t => {
  let {http, handlers} = setup(t, false)

  setImmediate(() => { handlers.error('meow') })
  return t.rejects(http.request(http_opts))
})
