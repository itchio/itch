import {EventEmitter} from 'events'

let CHANGE_EVENT = 'change'

function Store () {}

Object.assign(Store.prototype, EventEmitter.prototype, {
  listeners: {},

  emit_change: function () {
    this.emit(CHANGE_EVENT)
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
