
import React from 'react'
import {Component} from 'react'

import {LoginPage} from './login'
import {SetupPage} from './setup'
import {LibraryPage} from './library'

import AppStore from '../stores/app-store'

function get_state () {
  return AppStore.get_state()
}

export class Layout extends Component {
  constructor () {
    super()
    this.state = get_state()
  }

  componentDidMount () {
    AppStore.add_change_listener('layout', () => {
      setImmediate(() => { this.setState(get_state()) }, 0)
    })
  }

  componentWillUnmount () {
    AppStore.remove_change_listener('layout')
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
