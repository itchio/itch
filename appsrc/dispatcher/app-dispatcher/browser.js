
let os = require('../../util/os')
if (os.process_type() !== 'browser') {
  throw new Error(`app-dispatcher/browser required from ${os.process_type()}`)
}

let Log = require('../../util/log')
let log = Log('dispatcher')
let opts = {logger: new Log.Logger({sinks: {console: !!process.env.MARCO_POLO}})}

let electron = require('electron')
let ipc = electron.ipcMain
let BrowserWindow = electron.BrowserWindow

let spammy = {
  CAVE_PROGRESS: true,
  GAMES_FETCHED: true,
  GAME_STORE_DIFF: true,
  CAVE_STORE_DIFF: true,
  INSTALL_LOCATION_STORE_DIFF: true
}

// Adapted from https://github.com/parisleaf/flux-dispatcher
// A Flux-style dispatcher with promise support and some amount of validation
class BrowserDispatcher {
  constructor () {
    this._callbacks = {}
    this._message_id_seed = 0
  }

  /**
  * Register an action callback, returns dispatch token
  */
  register (name, callback) {
    if (typeof name !== 'string') {
      throw new Error('Invalid store registration (non-string name)')
    }
    if (this._callbacks[name]) {
      throw new Error(`Can't register store twice (renderer-side): ${name}`)
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

    if (!spammy[payload.action_type]) {
      if (payload.private) {
        log(opts, `dispatching ${payload.action_type}`)
      } else {
        log(opts, `dispatching: ${JSON.stringify(payload, null, 2)}`)
      }
    }

    Object.keys(this._callbacks).forEach((store_id) => {
      let callback = this._callbacks[store_id]
      if (typeof callback === 'function') {
        callback(payload)
      }
    })

    BrowserWindow.getAllWindows().forEach(w =>
      w.webContents.send('dispatcher-to-renderer', payload)
    )
  }
}

let self = new BrowserDispatcher()

ipc.on('dispatcher-to-browser', (ev, payload) => {
  self.dispatch(payload)
})

module.exports = self
