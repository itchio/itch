import ipc from 'ipc'

import Promise from 'bluebird'
import os from '../util/os'

let Log = require('../util/log')
let log = Log('dispatcher')
let opts = {logger: new Log.Logger({sinks: {console: false}})}

// This makes sure everything is dispatched to the node side, whatever happens
if (os.process_type() === 'renderer') {
  // Using IPC over RPC because the latter breaks when passing instances of
  // Babel-compiled ES6 classes (only the fields seem to be exposed, not the methods)
  let self = {
    register: () => {
      throw new Error('Registering from renderer: unsupported so far')
    },

    dispatch: (payload) => {
      ipc.send('dispatch', payload)
    }
  }

  module.exports = self
} else {
  // Adapted from https://github.com/parisleaf/flux-dispatcher
  // A Flux-style dispatcher with promise support and some amount of validation
  class Dispatcher {
    constructor () {
      this._callbacks = []
    }

    /**
     * Register an action callback, returns dispatch token
     */
    register (callback) {
      this._callbacks.push(callback)
      return this._callbacks.length - 1
    }

    /**
     * Expects payload to be an object with at least 'action_type', otherwise
     * will throw - helps debugging missing constants
     */
    dispatch (payload) {
      let t1 = +new Date()
      if (this._promises) {
        throw new Error(`Can't call dispatch synchronously from an action callback`)
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

      this._promises = this._callbacks.map(function (_, i) {
        return new Promise(function (resolve, reject) {
          resolves[i] = resolve
          rejects[i] = reject
        })
      })

      this._callbacks.forEach(function (callback, i) {
        Promise.resolve(callback(payload)).then(() =>
          resolves[i](payload)
        ).catch((err) =>
          rejects[i](err)
        )
      })

      let overallPromise = Promise.all(this._promises).then(() => payload)
      this._promises = null

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
      let promise_indices = []
      for (let i = 0; i < arguments.length; i++) {
        let argument = arguments[i]
        if (typeof argument.dispatch_token === 'undefined') {
          throw new Error(`Dispatcher.wait_for() trying to wait on something that's not a store: ${JSON.stringify(argument)}`)
        }
        promise_indices.push(argument.dispatch_token)
      }

      if (!this._promises) {
        throw new Error('Dispatcher.wait_for() can only be called synchronously from a registered store callback')
      }

      let selected_promises = promise_indices.map((index) => {
        return this._promises[index]
      })
      return Promise.all(selected_promises)
    }
  }

  let self = new Dispatcher()

  ipc.on('dispatch', (ev, payload) => {
    self.dispatch(payload)
  })

  module.exports = self
}
