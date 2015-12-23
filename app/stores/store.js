'use strict'

let EventEmitter = require('events').EventEmitter
let os = require('../util/os')

let CHANGE_EVENT = 'change'

function Store (name, process_type) {
  if (typeof process_type === 'undefined') {
    process_type = 'browser'
  }
  if (typeof name !== 'string') {
    throw new Error(`Invalid store definition: missing name`)
  }
  this.name = name

  if (os.process_type() !== process_type) {
    throw new Error(`Tried to require a ${process_type} store from ${os.process_type()}`)
  }
  this.process_type = process_type

  if (this.process_type === 'browser') {
    require('electron').ipcMain.on(`${this.name}-fetch`, (e) => {
      e.sender.send(`${this.name}-state`, this.get_state())
    })
  }
}

Object.assign(Store.prototype, EventEmitter.prototype, {
  listeners: {},

  get_state: function () {
    return {}
  },

  emit_change: function () {
    this.emit(CHANGE_EVENT, this.get_state())

    if (this.process_type === 'browser') {
      require('electron').BrowserWindow.getAllWindows().forEach((w) => {
        w.webContents.send(`${this.name}-change`)
      })
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
  return function (payload) {
    let handler = handlers[payload.action_type]
    if (!handler) return
    return handler(payload)
  }
}

Store.subscribe = (name, cb) => {
  if (os.process_type() === 'renderer') {
    let ipc = require('electron').ipcRenderer
    ipc.on(`${name}-change`, () => ipc.send(`${name}-fetch`))
    ipc.on(`${name}-state`, (ev, data) => cb(data))

    ipc.send(`${name}-fetch`)
  } else {
    let store_path = `./${name}`
    console.log(`Subscribing to ${store_path}`)
    let specific_store = require(store_path)
    specific_store.add_change_listener('anonymous', cb)
  }
}

module.exports = Store
