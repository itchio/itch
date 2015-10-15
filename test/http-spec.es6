import test from 'zopf'
import proxyquire from 'proxyquire'
import assign from 'object-assign'

import electron from './stubs/electron'

let setup = (t) => {
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
  t.stub(request, 'get').returns(stub)

  return assign({request, http, handlers}, electron)
}

let http_opts = {
  url: 'http://-invalid/hello.txt',
  sink: {},
  onprogress: () => {}
}

test('http', t => {
  let {http, handlers} = setup(t)

  t.case('resolves on close', t => {
    setImmediate(() => { handlers.close() })
    return http.request(http_opts)
  })

  t.case('rejects non-2xx response', t => {
    setImmediate(() => { handlers.response({statusCode: 404}) })
    return t.rejects(http.request(http_opts))
  })

  t.case('rejects errors', t => {
    setImmediate(() => { handlers.error('meow') })
    return t.rejects(http.request(http_opts))
  })
})
