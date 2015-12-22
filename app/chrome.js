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
let I18nextProvider = require('react-i18next').I18nextProvider

let I18nStore = require('./stores/i18n-store')

let app_node

function render () {
  app_node = document.querySelector('#app')
  let i18n = I18nStore.get_state()
  ReactDOM.render(r(I18nextProvider, {i18n}, [r(Layout)]), app_node)
}

document.addEventListener('DOMContentLoaded', () => {
  render()
  I18nStore.add_change_listener('chrome', render)
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
    case 'F12':
      let win = window.require('electron').remote.getCurrentWindow()
      win.webContents.openDevTools({detach: true})
      break
    case 'F5':
      if (!e.shiftKey) return
      window.location.reload()
      break
  }
})
