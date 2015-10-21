
import React from 'react'
import {Component} from 'react'

import {LoginPage} from './login'
import {SetupPage} from './setup'
import {LibraryPage} from './library'

import ipc from 'ipc'

let gateway = Object.assign({}, require('events').EventEmitter.prototype)

ipc.on('app-store-change', (state) => {
  gateway.emit('change', state)
})

let state_num = 0

export class Layout extends Component {
  constructor () {
    super()
    this.state = { page: '' }
  }

  stateArrived (state, stoot_num) {
    if (stoot_num < state_num) {
      return
    }
    this.setState(state)
  }

  componentDidMount () {
    gateway.on('change', (state) => {
      state_num++
      let stoot_num = state_num
      setTimeout(() => {
        this.stateArrived(state, stoot_num)
      }, 0)
    })
  }

  componentWillUnmount () {
    gateway.removeAllListeners('change')
  }

  render () {
    let {setup, login, library} = this.state

    switch (this.state.page) {
      case 'setup':
        return <SetupPage {...setup}/>
      case 'login':
        return <LoginPage {...login}/>
      case 'library':
        return <LibraryPage {...library}/>
      default:
        return <div/>
    }
  }
}
