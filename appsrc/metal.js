'use strict'

// This file is the entry point for the main (browser) process

import './boot/sourcemaps'
import './boot/bluebird'
import './boot/crash'
import './boot/env'
import './boot/fs'

import autoUpdater from './util/auto-updater'
import {isItchioURL} from './util/url'

// Fresh installs
(function () {
  const fs = require('fs')
  const {app} = require('electron')
  const userDataPath = app.getPath('userData')
  console.log(`Creating ${userDataPath} in case it doesn't exist..`)

  try {
    fs.mkdirSync(userDataPath)
  } catch (err) {
    if (err.code === 'EEXIST') {
      // good
      return
    }
    console.log(`While creating ${userDataPath}: ${err.stack || err}`)
  }
})()

async function autoUpdate (autoUpdateDone) {
  const quit = await autoUpdater.start()
  if (quit) {
    // squirrel on win32 sometimes requires exiting as early as possible
    process.exit(0)
  } else {
    autoUpdateDone()
  }
}

autoUpdate(autoUpdateDone) // no need to wait for app.on('ready')

// App lifecycle

function autoUpdateDone () {
  const app = require('electron').app

  const {
    preboot,
    prepareQuit,
    focusWindow,
    openUrl
  } = require('./actions')
  const store = require('./store').default

  app.on('ready', async () => {
    const shouldQuit = app.makeSingleInstance((argv, cwd) => {
      // we only get inside this callback when another instance
      // is launched - so this executes in the context of the main instance
      handleUrls(argv)
      store.dispatch(focusWindow())
    })

    if (shouldQuit) {
      // app.quit() is the source of all our problems,
      // cf. https://github.com/itchio/itch/issues/202
      process.exit(0)
      return
    }
    handleUrls(process.argv)

    store.dispatch(preboot())
  })

  app.on('activate', () => {
    store.dispatch(focusWindow())
  })

  app.on('before-quit', (e) => {
    store.dispatch(prepareQuit())
  })

  app.on('window-all-closed', (e) => {
    const state = store.getState()
    if (state.ui.mainWindow.quitting) {
      // let normal electron shutdown process continue
      return
    } else {
      // prevent electron shutdown, we want to remain alive
      e.preventDefault()
    }
  })

  // macOS (Info.pList)
  app.on('open-url', (e, url) => {
    if (isItchioURL(url)) {
      // macOS will err -600 if we don't
      e.preventDefault()
      store.dispatch(openUrl(url))
    } else {
      console.log(`Ignoring non-itchio url: ${url}`)
    }
  })

  // URL handling

  function handleUrls (argv) {
    // Windows (reg.exe), Linux (XDG)
    argv.forEach((arg) => {
      // XXX should we limit to one url at most ?
      if (isItchioURL(arg)) {
        store.dispatch(openUrl(arg))
      }
    })
  }
}
