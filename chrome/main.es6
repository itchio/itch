
import ReactDOM from 'react-dom'
import React from 'react'
import {Layout} from './chrome/components/layout'

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<Layout/>, document.body)
})

window.addEventListener('beforeunload', () => {
  ReactDOM.unmountComponentAtNode(document.body)
})

window.addEventListener('keydown', (e) => {
  switch (e.keyIdentifier) {
    case 'F12':
      let win = window.require('remote').getCurrentWindow()
      win.openDevTools()
      break
    case 'F5':
      if (!e.shiftKey) return
      window.location.reload()
      break
  }
})
