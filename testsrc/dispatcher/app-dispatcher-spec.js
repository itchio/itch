
import test from 'zopf'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

import electron from '../stubs/electron'

test('dispatcher', t => {
  const env = test.module({
    name: 'production'
  })

  let b_stubs = Object.assign({}, electron, {
    '../../env': env
  })

  let r_stubs = Object.assign({}, electron, {
    '../../util/os': test.module({ process_type: () => 'renderer' })
  })

  let fake_window = {
    webContents: {
      send: (name, payload) => electron.electron.ipcRenderer.emit(name, {}, payload)
    }
  }
  t.stub(electron.electron.BrowserWindow, 'getAllWindows').returns([fake_window])

  let b_dispatcher = proxyquire('../../app/dispatcher/app-dispatcher/browser', b_stubs).default
  let r_dispatcher = proxyquire('../../app/dispatcher/app-dispatcher/renderer', r_stubs).default

  let r_spy = t.spy(function () { console.log('r_spy ' + JSON.stringify(Array.prototype.slice.call(arguments))) })
  r_dispatcher.register('renderer-store', r_spy)

  let b_spy = t.spy(function () { console.log('b_spy ' + JSON.stringify(Array.prototype.slice.call(arguments))) })
  b_dispatcher.register('browser-store', b_spy)

  t.case('dispatch from renderer', t => {
    let payload = {action_type: 'hello_from_renderer'}
    r_dispatcher.dispatch(payload)

    sinon.assert.calledWith(r_spy, payload)
    sinon.assert.calledWith(b_spy, payload)
  })

  t.case('dispatch from browser', t => {
    let payload = {action_type: 'hello_from_browser', private: true}
    b_dispatcher.dispatch(payload)

    sinon.assert.calledWith(r_spy, payload)
    sinon.assert.calledWith(b_spy, payload)

    t.throws(() => {
      b_dispatcher.register(() => null)
    }, 'validates store name')

    t.throws(() => {
      b_dispatcher.dispatch({atcion_type: 'typo'})
    }, 'validate action type')
  })
})
