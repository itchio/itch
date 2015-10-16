import test from 'zopf'
import assign from 'object-assign'
import proxyquire from 'proxyquire'

import electron from './stubs/electron'

test('dispatcher', t => {
  t.case('node-side', t => {
    let stubs = assign({}, electron)
    let dispatcher = proxyquire('../app/dispatcher/app-dispatcher', stubs)
    t.true(!!dispatcher, 'has')
  })

  t.case('renderer-side', t => {
    let stubs = assign({
      '../util/os': {
        process_type: () => 'renderer'
      }
    }, electron)
    t.stub(electron.remote, 'require').returns(197)
    let dispatcher = proxyquire('../app/dispatcher/app-dispatcher', stubs)
    t.is(dispatcher, 197, 'has')
  })
})
