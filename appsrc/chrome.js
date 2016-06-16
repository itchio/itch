'use strict'

// This file is the entry point for renderer processes

import './boot/env'
import './boot/bluebird'
import './boot/fs'
import './boot/env'
import './boot/sniff-language'

import React from 'react'
import ReactDOM from 'react-dom'
import Layout from './components/layout'
import Modal from './components/modal'
import {Provider} from 'react-redux'
import HTML5Backend from 'react-dnd-html5-backend'
import {DragDropContext} from 'react-dnd'
import {shell, webFrame} from './electron'

import store from './store'

const REDUX_DEVTOOLS_ENABLED = process.env.REDUX_DEVTOOLS === '1'

let devTools = ''
if (REDUX_DEVTOOLS_ENABLED) {
  const DevTools = require('./components/dev-tools').default
  devTools = <DevTools/>
}

let appNode

function render () {
  appNode = document.querySelector('#app')
  const WrappedLayout = DragDropContext(HTML5Backend)(Layout)
  const rootComponent = <Provider store={store}>
    <div>
      <WrappedLayout/>
      <Modal/>
      {devTools}
    </div>
  </Provider>
  ReactDOM.render(rootComponent, appNode)
}

document.addEventListener('DOMContentLoaded', render)

window.addEventListener('beforeunload', () => {
  if (appNode) {
    ReactDOM.unmountComponentAtNode(appNode)
    appNode = null
  }
})

// open actual link elements in external browser

document.addEventListener('click', (e) => {
  let target = e.target

  while (target && target.tagName !== 'A') {
    target = target.parentNode
  }

  if (target) {
    e.preventDefault()
    shell.openExternal(target.href)
    return false
  }
})

// disable two-finger zoom on macOS

webFrame.setZoomLevelLimits(1, 1)
