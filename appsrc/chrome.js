'use strict'

// This file is the entry point for renderer processes

import 'babel-polyfill'

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
import {shell} from './electron'

import env from './env'
import store from './store'

let devTools = ''
if (env.name === 'development') {
  const DevTools = require('./components/dev-tools').default
  devTools = <DevTools/>
}

let appNode

function render () {
  appNode = document.querySelector('#app')
  const layout = <Provider store={store}>
    <div>
      <Layout/>
      <Modal/>
      {devTools}
    </div>
  </Provider>
  ReactDOM.render(layout, appNode)
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
