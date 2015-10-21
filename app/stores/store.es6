import {EventEmitter} from 'events'
import os from '../util/os'

let CHANGE_EVENT = 'change'
let ipc

function Store (name, process_type = 'browser') {
  if (typeof name !== 'string') {
    throw new Error(`Invalid store definition: missing name`)
  }
  this.name = name

  if (os.process_type() !== process_type) {
    throw new Error(`Tried to require a ${process_type} store from ${os.process_type()}`)
  }
  this.process_type = process_type
}

Object.assign(Store.prototype, EventEmitter.prototype, {
  listeners: {},

  get_state: function () {
    return {}
  },

  emit_change: function () {
    this.emit(CHANGE_EVENT)

    if (this.process_type === 'browser') {
      if (!ipc) {
        ipc = require('./window-store').with(w => {
          let channel = `${this.name}-change`
          let state = this.get_state()
          console.log(`sending ${channel} to renderer, with state ${state}`)
          w.webContents.send(channel, state)
        })
      }
    }
  },

  add_change_listener: function (name, callback) {
    this.listeners[name] = callback
    this.on(CHANGE_EVENT, callback)
  },

  remove_change_listener: function (name) {
    let callback = this.listeners[name]
    if (!callback) {
      return
    }
    delete this.listeners[name]
    this.removeListener(CHANGE_EVENT, callback)
  }
})

Store.action_listeners = (f) => {
  let handlers = {}
  let on = function (type, cb) {
    if (!type) {
      throw new Error('Trying to listen for null/undefined action')
    }
    handlers[type] = cb
  }
  f(on)
  return function (action) {
    let handler = handlers[action.action_type]
    if (!handler) return
    return handler(action)
  }
}

export default Store
