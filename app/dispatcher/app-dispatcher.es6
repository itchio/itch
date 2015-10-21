import ipc from 'ipc'

import Promise from 'bluebird'
import os from '../util/os'

let Log = require('../util/log')
let log = Log('dispatcher')
let opts = {logger: new Log.Logger({sinks: {console: true}})}

// This makes sure everything is dispatched to the node side, whatever happens
if (os.process_type() === 'renderer') {
  // Using IPC over RPC because the latter breaks when passing instances of
  // Babel-compiled ES6 classes (only the fields seem to be exposed, not the methods)
  let self = {
    _callbacks: {},

    register: (name, cb) => {
      log(opts, `Registering ${name} from renderer`)
      self._callbacks[name] = cb
      ipc.send('dispatcher-register', name, {remote: true})
    },

    wait_for: () => {
      throw new Error(`Can't wait_for from renderer`)
    },

    dispatch: (payload) => {
      console.log(`IPC sending ${payload.action_type}`)
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
  let WindowStore = null
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
      console.log(`Registering store ${name} ${(typeof callback === 'function') ? 'node' : 'renderer'}-side`)
      this._callbacks[name] = callback
    }

    /**
     * Expects payload to be an object with at least 'action_type', otherwise
     * will throw - helps debugging missing constants
     */
    dispatch (payload) {
      let t1 = +new Date()
      if (this._promises) {
        let msg = `Can't call dispatch synchronously from an action callback`
        console.log(msg)
        throw new Error(msg)
      }

      if (typeof payload.action_type === 'undefined') {
        throw new Error(`Trying to dispatch action with no type: ${JSON.stringify(payload, null, 2)}`)
      }

      if (payload.private) {
        log(opts, `dispatching ${payload.action_type}`)
      } else {
        log(opts, `dispatching: ${JSON.stringify(payload, null, 2)}`)
      }

      let resolves = []
      let rejects = []

      this._promises = Object.keys(this._callbacks).map(function (store_id) {
        return new Promise(function (resolve, reject) {
          resolves[store_id] = resolve
          rejects[store_id] = reject
        })
      })

      Object.keys(this._callbacks).forEach((store_id) => {
        let callback = this._callbacks[store_id]
        if (typeof callback === 'function') {
          Promise.resolve(callback(payload)).then(() =>
            resolves[store_id]()
          ).catch((err) =>
            rejects[store_id](err)
          )
        } else {
          resolves[store_id]()
        }
      })

      let overallPromise = Promise.all(this._promises)
      this._promises = null
      log(opts, `ready to dispatch something after ${payload.action_type}`)

      if (!WindowStore) {
        WindowStore = require('../stores/window-store')
      }
      WindowStore.with(w => w.webContents.send('dispatcher-dispatch2', payload))

      return overallPromise.then((res) => {
        let t2 = +new Date()
        log(opts, `dispatched ${payload.action_type} in ${t2 - t1}ms`)
        return res
      })
    }

    /**
     * Return promise to chain on rather than being sync
     * Can only call synchronously from within an action listener
     * (after you've returned it's too late, some other action might
     * be dispatched)
     */
    wait_for () {
      let store_ids = []
      for (let i = 0; i < arguments.length; i++) {
        let argument = arguments[i]
        let cb = this._callbacks[argument]
        if (!cb) {
          throw new Error(`Dispatcher.wait_for() trying to wait on something that's not a store: ${argument}`)
        }
        if (typeof cb !== 'function') {
          throw new Error(`Dispatcher.wait_for() trying to wait on a renderer-side store`)
        }
        store_ids.push(argument)
      }

      if (!this._promises) {
        throw new Error('Dispatcher.wait_for() can only be called synchronously from a registered store callback')
      }

      let selected_promises = store_ids.map((index) => {
        return this._promises[index]
      })
      return Promise.all(selected_promises)
    }
  }

  let self = new Dispatcher()

  ipc.on('dispatcher-dispatch', (ev, payload) => {
    console.log(`IPC got ${payload.action_type}`)
    self.dispatch(payload)
  })

  ipc.on('dispatcher-register', (ev, name, cb) => {
    self.register(name, cb)
  })

  module.exports = self
}
