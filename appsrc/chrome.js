'use strict'

import r from 'r-dom'
import ReactDOM from 'react-dom'
import Layout from './components/layout'
import {Provider} from 'react-redux'
import {shell, remote} from './electron'

import './boot/env'
import './boot/bluebird'
import './boot/fs'

import store from './store'
import {focusPanel} from './actions'

let appNode

function render () {
  appNode = document.querySelector('#app')
  const layout = r(Provider, {store}, r(Layout))
  ReactDOM.render(layout, appNode)
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
    shell.openExternal(target.href)
    return false
  }
})

window.addEventListener('beforeunload', () => {
  if (!appNode) return
  ReactDOM.unmountComponentAtNode(appNode)
  appNode = null
})

window.addEventListener('keydown', (e) => {
  // TODO: move all those shortcuts to actions
  switch (e.keyIdentifier) {
    case 'F12': // Shift-F12
      if (e.shiftKey) {
        const win = remote.getCurrentWindow()
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
      store.dispatch(focusPanel('search'))
      break
  }
})
