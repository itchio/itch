'use strict'

require('bluebird').config({
  longStackTraces: true,
  cancellation: true
})

let env = require('./env')

if (env.name === 'development') {
  console.log('Development environment, using babel require hook')

  // use register hook in dev, production builds are precompiled.
  require('babel-register')
} else {
  console.log('Pre-compiled, not using require hook.')
}

let r = require('r-dom')
let ReactDOM = require('react-dom')
let Layout = require('./components/layout').Layout

let app_node

document.addEventListener('DOMContentLoaded', () => {
  app_node = document.querySelector('#app')
  ReactDOM.render(r(Layout), app_node)
})

document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    e.preventDefault()
    window.require('electron').shell.openExternal(e.target.href)
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
    case 'F12':
      let win = window.require('electron').remote.getCurrentWindow()
      win.openDevTools()
      break
    case 'F5':
      if (!e.shiftKey) return
      window.location.reload()
      break
  }
})
