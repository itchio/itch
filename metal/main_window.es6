
import app from 'app'
import BrowserWindow from 'browser-window'

import AppActions from './actions/app_actions'
import {make_tray} from './tray'

let booted = false
let main_window

export function get () {
  return main_window
}

export function hide () {
  if (!main_window) return
  main_window.close()
}

export function show () {
  if (main_window) {
    main_window.show()
    return
  }

  if (!booted) {
    AppActions.boot()
    booted = true
  }

  main_window = new BrowserWindow({
    title: 'itch.io',
    icon: './static/images/itchio-tray-x4.png',
    width: 1200,
    height: 720,
    center: true,
    'title-bar-style': 'hidden'
  })

  main_window.on('close', (e) => {
    main_window = null
  })

  main_window.loadUrl(`file://${__dirname}/../index.html`)

  if (process.env.DEVTOOLS === '1') {
    main_window.openDevTools()
  }
}

export function install () {
  app.on('window-all-closed', (e) => {
    e.preventDefault()
  })

  app.on('ready', () => {
    make_tray()
    show()
  })

  app.on('activate', () => {
    show()
  })

  app.on('ready', () => {
    show()
  })
}

export default {
  get,
  hide,
  show,
  install
}

