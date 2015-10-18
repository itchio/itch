import test from 'zopf'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

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

  t.throws(() => {
    dispatcher.register()
  })
})

let setup = t => {
  let stubs = Object.assign({}, electron)
  t.stub(electron.ipc, 'on').callsArgWith(1, {}, {action_type: 'coverage'})
  let dispatcher = proxyquire('../../app/dispatcher/app-dispatcher', stubs)
  return {dispatcher}
}

test('dispatcher (sides)', t => {
  t.case('dispatch', t => {
    let {dispatcher} = setup(t)
    dispatcher.dispatch({action_type: 'yellow'})
    dispatcher.dispatch({action_type: 'green', private: true})
    t.throws(() => {
      dispatcher.dispatch({atcion_type: 'typo'})
    })
  })

  t.case('synchronously dispatch in an action callback', t => {
    let {dispatcher} = setup(t)
    dispatcher.register(() => {
      dispatcher.dispatch({action_type: 'red'})
    })
    t.throws(() => {
      dispatcher.dispatch({action_type: 'yellow'})
    })
  })

  t.case('wait_for', t => {
    let {dispatcher} = setup(t)

    let stubs = {}
    let stores = {}

    t.throws(() => dispatcher.wait_for())

    ;['a', 'b', 'c'].forEach((letter) => {
      let stub = t.stub().resolves()
      stubs[letter] = stub
      stores[letter] = {
        dispatch_token: dispatcher.register(stub)
      }
    })

    dispatcher.register((action) => {
      t.throws(() => dispatcher.wait_for(1, 2, 3))

      return dispatcher.wait_for(stores.a, stores.b, stores.c).then(() => {
        ['a', 'b', 'c'].forEach((letter) => {
          sinon.assert.calledWith(stubs[letter], action)
        })
      })
    })
    return dispatcher.dispatch({action_type: 'yellow'})
  })
})
