'use nodent';'use strict'
let test = require('zopf')
let sinon = require('sinon')
let proxyquire = require('proxyquire')

let electron = require('../stubs/electron')

test('dispatcher', t => {
  let r_stubs = Object.assign({
    '../util/os': { process_type: () => 'renderer' }
  }, electron)

  let fake_window = {
    webContents: {
      send: (name, payload) => electron.ipc.emit(name, {}, payload)
    }
  }
  t.stub(electron['browser-window'], 'getAllWindows').returns([fake_window])

  let b_dispatcher = proxyquire('../../app/dispatcher/app-dispatcher', electron)
  let original_on = electron.ipc.on.bind(electron.ipc)
  let on = t.stub(electron.ipc, 'on', function (name, cb) {
    original_on(name, function () {
      // strip 'ev'
      let args = []
      for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
      }
      cb.apply(null, args)
    })
  })
  let r_dispatcher = proxyquire('../../app/dispatcher/app-dispatcher', r_stubs)
  on.restore()

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
