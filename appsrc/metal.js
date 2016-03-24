'use strict'

// This file is the entry point for the main (browser) process

import 'babel-polyfill'
import './boot/sourcemaps'
import './boot/bluebird'
import './boot/crash'
import './boot/env'
import './boot/fs'

import autoUpdater from './util/auto-updater'

async function autoUpdate () {
  const quit = await autoUpdater.start()
  if (quit) {
    // squirrel on win32 sometimes requires exiting as early as possible
    process.exit(0)
  }
}

autoUpdate() // no need to wait for app.on('ready')

// App lifecycle

import {app} from './electron'

import {
  preboot,
  prepareQuit,
  focusWindow,
  openUrl
} from './actions'
import store from './store'

app.on('ready', () => {
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
  }
  handleUrls(process.argv)

  store.dispatch(preboot())
})

app.on('activate', () => {
  store.dispatch(focusWindow())
})

app.on('before-quit', e => {
  store.dispatch(prepareQuit())
})

app.on('window-all-closed', e => {
  const state = store.getState()
  if (state.ui.mainWindow.quitting) {
    // let normal electron shutdown process continue
    return
  } else {
    // prevent electron shutdown, we want to remain alive
    e.preventDefault()
  }
})

// OSX (Info.pList)
app.on('open-url', (e, url) => {
  if (isItchioURL(url)) {
    // OSX will err -600 if we don't
    e.preventDefault()
    store.dispatch(openUrl({url}))
  } else {
    console.log(`Ignoring non-itchio url: ${url}`)
  }
})

// URL handling

import urlParser from 'url'

function isItchioURL (s) {
  return urlParser.parse(s).protocol === 'itchio:'
}

function handleUrls (argv) {
  // Windows (reg.exe), Linux (XDG)
  argv.forEach((arg) => {
    // XXX should we limit to one url at most ?
    if (isItchioURL(arg)) {
      store.dispatch(openUrl(arg))
    }
  })
}
