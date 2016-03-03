
import os from '../../util/os'
if (os.process_type() !== 'browser') {
  throw new Error(`app-dispatcher/browser required from ${os.process_type()}`)
}

const marco_level = parseInt(process.env.MARCO_POLO || '0', 10)
import Log from '../../util/log'
let log = Log('dispatcher')
let opts = {logger: new Log.Logger({sinks: {console: (marco_level > 0)}})}

import env from '../../env'
let ipcMain, BrowserWindow

if (env.name === 'test') {
} else {
  const electron = require('electron')
  ipcMain = electron.ipcMain
  BrowserWindow = electron.BrowserWindow
}

let spammy = {
  CAVE_PROGRESS: true,
  GAME_STORE_DIFF: true,
  CAVE_STORE_DIFF: true,
  INSTALL_LOCATION_STORE_DIFF: true
}

// Adapted from https://github.com/parisleaf/flux-dispatcher
// A Flux-style dispatcher with promise support and some amount of validation
class BrowserDispatcher {
  constructor () {
    this._callbacks = {}
  }

  /**
  * Register an action callback, returns dispatch token
  */
  register (name, callback) {
    pre: { // eslint-disable-line
      typeof name === 'string'
      !this._callbacks[name]
    }

    log(opts, `Registering store ${name} node-side`)
    this._callbacks[name] = callback
  }

  /**
  * Expects payload to be an object with at least 'action_type', otherwise
  * will throw - helps debugging missing constants
  */
  dispatch (payload) {
    pre: { // eslint-disable-line
      typeof payload === 'object'
      typeof payload.action_type === 'string'
    }

    if (marco_level >= 2 && !spammy[payload.action_type]) {
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

    if (marco_level >= 1) {
      log(opts, `browser >>> renderer: ${payload.action_type}, ${JSON.stringify(payload).length} bytes`)
    }

    if (BrowserWindow) {
      BrowserWindow.getAllWindows().forEach(w => {
        // async ipc is marshalled to JSON internally, so there's
        // no RemoteMember penalty on either side, but we should
        // keep the payloads light anyway
        w.webContents.send('dispatcher-to-renderer', payload)
      })
    }
  }
}

let self = new BrowserDispatcher()

if (ipcMain) {
  ipcMain.on('dispatcher-to-browser', (ev, payload) => {
    self.dispatch(payload)
  })
}

export default self
