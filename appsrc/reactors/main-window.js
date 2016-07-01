
import {darkMineShaft} from '../constants/colors'
import {app, BrowserWindow} from '../electron'
import config from '../util/config'
import os from '../util/os'
import invariant from 'invariant'
import {debounce} from 'underline'

import localizer from '../localizer'
import * as actions from '../actions'

let createLock = false
let quitting = false

const BOUNDS_CONFIG_KEY = 'main_window_bounds'

async function createWindow (store) {
  if (createLock) return
  createLock = true

  const userBounds = config.get(BOUNDS_CONFIG_KEY) || {}
  const bounds = {
    x: -1,
    y: -1,
    width: 1250,
    height: 720,
    ...userBounds
  }
  const {width, height} = bounds
  const center = (bounds.x === -1 && bounds.y === -1)
  const iconPath = `${__dirname}/../static/images/tray/${app.getName()}.png`

  const window = new BrowserWindow({
    title: app.getName(),
    icon: iconPath,
    width, height,
    center,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: darkMineShaft,
    titleBarStyle: 'hidden'
  })

  if (os.platform() === 'darwin') {
    try {
      // TODO: restore once https://github.com/electron/electron/issues/6056 is fixed
      console.log(`setting icon to: ${iconPath}`)
      app.dock.setIcon(iconPath)
    } catch (err) {
      console.log(`error setting icon: ${err.stack || err}`)
    }
  }

  if (!center) {
    window.setPosition(bounds.x, bounds.y)
  }

  let destroyTimeout

  window.on('close', (e) => {
    if (quitting) {
      // alright alright you get to close
      return
    }

    if (!window.isMinimized()) {
      const store = require('../store').default
      let prefs = {}
      if (store) {
        prefs = store.getState().preferences || {}
      }
      if (!prefs.gotMinimizeNotification) {
        store.dispatch(actions.updatePreferences({
          gotMinimizeNotification: true
        }))

        const i18n = store.getState().i18n
        const t = localizer.getT(i18n.strings, i18n.lang)
        store.dispatch(actions.notify({
          title: t('notification.see_you_soon.title'),
          body: t('notification.see_you_soon.message')
        }))
      }

      // minimize first to convey the fact that the app still lives
      // in the tray - however, it'll take a lot less RAM because the
      // renderer is actually trashed
      e.preventDefault()
      window.minimize()

      setTimeout(() => {
        if (!window.isDestroyed()) {
          window.hide()
        }
      }, 0.2 * 1000)

      destroyTimeout = setTimeout(() => {
        if (!window.isDestroyed() && !window.isVisible()) {
          window.close()
        }
      }, 10 * 1000)
    }
  })

  window.on('closed', (e) => {
    store.dispatch(actions.windowDestroyed())
  })

  window.on('focus', (e) => {
    if (destroyTimeout) {
      clearTimeout(destroyTimeout)
      destroyTimeout = null
    }
    store.dispatch(actions.windowFocusChanged({focused: true}))
  })

  window.on('blur', (e) => {
    store.dispatch(actions.windowFocusChanged({focused: false}))
  })

  window.on('enter-full-screen', (e) => {
    store.dispatch(actions.windowFullscreenChanged({fullscreen: true}))
  })

  window.on('leave-full-screen', (e) => {
    store.dispatch(actions.windowFullscreenChanged({fullscreen: false}))
  })

  const debouncedBounds = (() => {
    if (window.isDestroyed()) {
      return
    }
    const bounds = window.getBounds()
    store.dispatch(actions.windowBoundsChanged({bounds}))
  })::debounce(2000)

  window.on('move', (e) => {
    debouncedBounds()
  })

  window.on('resize', (e) => {
    debouncedBounds()
  })

  window.on('ready-to-show', (e) => {
    createLock = false
    store.dispatch(actions.windowReady({id: window.id}))
    window.show()
  })

  const uri = `file://${__dirname}/../index.html`
  window.loadURL(uri)

  if (parseInt(process.env.DEVTOOLS, 10) > 0) {
    window.webContents.openDevTools({detach: true})
  }
}

async function windowBoundsChanged (store, action) {
  // TODO: this should move to preferences, why are we using config again?
  const {bounds} = action.payload
  config.set(BOUNDS_CONFIG_KEY, bounds)
}

async function focusWindow (store, action) {
  const id = store.getState().ui.mainWindow.id
  const options = action.payload || {}

  if (id) {
    const window = BrowserWindow.fromId(id)
    invariant(window, 'window still exists')
    if (options.toggle && window.isVisible()) {
      window.hide()
    } else {
      window.show()
    }
  } else {
    await createWindow(store)
  }
}

async function hideWindow () {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    window.close()
  }
}

async function closeTabOrAuxWindow (store) {
  const focused = BrowserWindow.getFocusedWindow()
  if (focused) {
    const id = store.getState().ui.mainWindow.id
    if (focused.id === id) {
      store.dispatch(actions.closeTab())
    } else {
      focused.close()
    }
  }
}

async function quitWhenMain (store) {
  const mainId = store.getState().ui.mainWindow.id
  const focused = BrowserWindow.getFocusedWindow()

  if (focused) {
    if (focused.id === mainId) {
      store.dispatch(actions.quit())
    } else {
      focused.close()
    }
  }
}

async function quitElectronApp () {
  app.quit()
}

async function prepareQuit () {
  // sigh..
  quitting = true
}

async function quit (store) {
  store.dispatch(actions.prepareQuit())
  store.dispatch(actions.quitElectronApp())
}

async function boot (store, action) {
  await focusWindow(store, action)
}

export default {
  boot, focusWindow, hideWindow, windowBoundsChanged,
  closeTabOrAuxWindow, quitWhenMain, quitElectronApp, prepareQuit, quit
}
