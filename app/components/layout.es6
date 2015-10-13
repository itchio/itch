
import React from 'react'
import {Component} from 'react'

import {LoginPage} from './login'
import {SetupPage} from './setup'
import {LibraryPage} from './library'

let remote = window.require('remote')
let AppStore = remote.require('./stores/app_store')

function get_state () {
  return JSON.parse(AppStore.get_state_json())
}

export class Layout extends Component {
  constructor () {
    super()
    this.state = get_state()
  }

  componentDidMount () {
    AppStore.add_change_listener('layout', this.on_change.bind(this))
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

  on_change () {
    setTimeout(() => { this.setState(get_state()) }, 0)
  }
}
