'use nodent';'use strict'
let ipc = require('ipc')

let os = require('../util/os')

let Log = require('../util/log')
let log = Log('dispatcher')
let opts = {logger: new Log.Logger({sinks: {console: false}})}

// This makes sure everything is dispatched to the node side, whatever happens
if (os.process_type() === 'renderer') {
  // Using IPC over RPC because the latter breaks when passing instances of
  // Babel-compiled ES6 classes (only the fields seem to be exposed, not the methods)
  let self = {
    _callbacks: {},

    register: (name, cb) => {
      log(opts, `Registering store ${name} renderer-side`)
      self._callbacks[name] = cb
    },

    dispatch: (payload) => {
      ipc.send('dispatcher-dispatch', payload)
    }
  }

  ipc.on('dispatcher-dispatch2', (payload) => {
    Object.keys(self._callbacks).forEach((store_id) => {
      let cb = self._callbacks[store_id]
      cb(payload)
    })
  })

  module.exports = self
} else {
  let BrowserWindow = require('browser-window')

  // Adapted from https://github.com/parisleaf/flux-dispatcher
  // A Flux-style dispatcher with promise support and some amount of validation
  class Dispatcher {
    constructor () {
      this._callbacks = {}
      this._message_id_seed = 0
    }

    /**
     * Register an action callback, returns dispatch token
     */
    register (name, callback) {
      if (typeof name !== 'string') {
        throw new Error('Invalid store registration')
      }
      log(opts, `Registering store ${name} node-side`)
      this._callbacks[name] = callback
    }

    /**
     * Expects payload to be an object with at least 'action_type', otherwise
     * will throw - helps debugging missing constants
     */
    dispatch (payload) {
      if (typeof payload.action_type === 'undefined') {
        throw new Error(`Trying to dispatch action with no type: ${JSON.stringify(payload, null, 2)}`)
      }

      if (payload.private) {
        log(opts, `dispatching ${payload.action_type}`)
      } else {
        log(opts, `dispatching: ${JSON.stringify(payload, null, 2)}`)
      }

      Object.keys(this._callbacks).forEach((store_id) => {
        let callback = this._callbacks[store_id]
        if (typeof callback === 'function') {
          callback(payload)
        }
      })

      BrowserWindow.getAllWindows().forEach(w =>
        w.webContents.send('dispatcher-dispatch2', payload)
      )
    }
  }

  let self = new Dispatcher()

  ipc.on('dispatcher-dispatch', (ev, payload) => {
    self.dispatch(payload)
  })

  module.exports = self
}
