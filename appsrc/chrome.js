'use strict'

import env from './env'
import r from 'r-dom'
import ReactDOM from 'react-dom'
import Layout from './components/layout'
import AppActions from './actions/app-actions'

if (env.name === 'development') {
  console.log('Development environment, using debug-friendly settings')

  require('bluebird').config({
    longStackTraces: true
  })
} else {
  console.log('Production environment, using optimized settings')

  require('bluebird').config({
    longStackTraces: false
  })
}
require('./util/sf')

let app_node

function render () {
  app_node = document.querySelector('#app')
  let layout = r(Layout)
  ReactDOM.render(layout, app_node)
}

document.addEventListener('DOMContentLoaded', () => {
  render()
})

document.addEventListener('click', (e) => {
  let target = e.target

  while (target && target.tagName !== 'A') {
    target = target.parentNode
  }
  if (!target) return

  if (target.tagName === 'A') {
    e.preventDefault()
    window.require('electron').shell.openExternal(target.href)
    return false
  }
})

window.addEventListener('beforeunload', () => {
  if (!app_node) return
  ReactDOM.unmountComponentAtNode(app_node)
  app_node = null
})

window.addEventListener('keydown', (e) => {
  switch (e.keyIdentifier) {
    case 'F12': // Shift-F12
      if (e.shiftKey) {
        let win = window.require('electron').remote.getCurrentWindow()
        win.webContents.openDevTools({detach: true})
      }
      break

    case 'F5': // Shift-F5
      if (e.shiftKey) {
        window.location.reload()
      }
      break

    case 'U+0052': // Shift-Cmd-R
      if (e.shiftKey && e.metaKey) {
        window.location.reload()
      }
      break

    case 'U+0046': // Ctrl-F / Cmd-F
      if (!e.ctrlKey && !e.metaKey) return
      AppActions.focus_panel('search')
      break
  }
})
