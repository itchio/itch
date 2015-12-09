'use nodent';'use strict'

import React from 'react'
import Component from './component'
import mori from 'mori'

import {LoginPage} from './login'
import {SetupPage} from './setup'
import {LibraryPage} from './library'

import AppStore from '../stores/app-store'
import defer from '../util/defer'

function get_state () {
  return {state: AppStore.get_state()}
}

export class Layout extends Component {
  constructor () {
    super()
    this.state = get_state()
  }

  componentDidMount () {
    AppStore.add_change_listener('layout', () => {
      defer(() => { this.setState(get_state()) })
    })
  }

  componentWillUnmount () {
    AppStore.remove_change_listener('layout')
  }

  render () {
    let state = this.state.state

    switch (mori.get(state, 'page')) {
      case 'setup':
        return <SetupPage state={mori.get(state, 'setup')}/>
      case 'login':
        return <LoginPage state={mori.get(state, 'login')}/>
      case 'library':
        return <LibraryPage state={mori.get(state, 'library')}/>
      default:
        return <div/>
    }
  }
}
