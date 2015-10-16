
import app from 'app'
import BrowserWindow from 'browser-window'

import AppActions from '../actions/app-actions'
import {make_tray} from './tray'

// TODO: turn that into a store
let self = {
  booted: false,
  main_window: null,

  get: function () {
    return self.main_window
  },

  hide: function () {
    if (!self.main_window) return
    self.main_window.close()
  },

  show: function () {
    if (self.main_window) {
      self.main_window.show()
      return
    }

    if (!self.booted) {
      AppActions.boot()
      self.booted = true
    }

    self.main_window = new BrowserWindow({
      title: 'itch.io',
      icon: './static/images/itchio-tray-x4.png',
      width: 1200,
      height: 720,
      center: true,
      'title-bar-style': 'hidden'
    })

    self.main_window.on('close', (e) => {
      self.main_window = null
    })

    self.main_window.loadUrl(`file://${__dirname}/../index.html`)

    if (process.env.DEVTOOLS === '1') {
      self.main_window.openDevTools()
    }
  },

  install: function () {
    app.on('window-all-closed', (e) => {
      e.preventDefault()
    })

    app.on('ready', () => {
      make_tray()
      self.show()
    })

    app.on('activate', () => {
      self.show()
    })

    app.on('ready', () => {
      self.show()
    })
  }
}

export default self
