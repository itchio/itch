'use nodent';'use strict'

require('bluebird').config({
  longStackTraces: true,
  cancellation: true
})

let ReactDOM = require('react-dom')
let React = require('react')
let Layout = require('./components/layout').Layout

let app_node

document.addEventListener('DOMContentLoaded', () => {
  app_node = document.querySelector('#app')
  ReactDOM.render(<Layout/>, app_node)
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
