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
    let dispatcher = proxyquire('../app/dispatcher/app-dispatcher', stubs)
    t.mock(electron.ipc).expects('send').once()
    dispatcher.dispatch({action_type: 'yellow'})
  })
})
