import {EventEmitter} from 'events'
import assign from 'object-assign'

let CHANGE_EVENT = 'change'

function Store () {}

assign(Store.prototype, EventEmitter.prototype, {
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

export default Store
