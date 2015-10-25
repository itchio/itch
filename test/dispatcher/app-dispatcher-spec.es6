import test from 'zopf'
import proxyquire from 'proxyquire'

import electron from '../stubs/electron'

test('dispatcher (renderer side)', t => {
  let stubs = Object.assign({
    '../util/os': {
      process_type: () => 'renderer'
    }
  }, electron)
  let dispatcher = proxyquire('../../app/dispatcher/app-dispatcher', stubs)
  t.mock(electron.ipc).expects('send').once()
  dispatcher.dispatch({action_type: 'yellow'})

  dispatcher.register('test-store', () => null)
})

let setup = t => {
  let stubs = Object.assign({}, electron)
  t.stub(electron.ipc, 'on').callsArgWith(1, {}, {action_type: 'coverage'})
  let dispatcher = proxyquire('../../app/dispatcher/app-dispatcher', stubs)
  return {dispatcher}
}

test('dispatcher (browser side)', t => {
  t.case('dispatch', t => {
    let {dispatcher} = setup(t)
    t.throws(() => {
      dispatcher.register(() => null)
    }, 'validates store name')
    dispatcher.register('test-store', () => null)
    dispatcher.dispatch({action_type: 'yellow'})
    dispatcher.dispatch({action_type: 'green', private: true})
    t.throws(() => {
      dispatcher.dispatch({atcion_type: 'typo'})
    }, 'validate action type')
  })
})
