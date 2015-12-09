'use nodent';'use strict'

import React from 'react'
import {PropTypes} from 'react'
import Component from './component'
import classNames from 'classnames'

import remote from 'remote'
let CredentialsStore = remote.require('./stores/credentials-store')

function get_state () {
  return { me: CredentialsStore.get_me() }
}

/**
 * A friendly component that displays your avatar and username
 */
class UserPanel extends Component {
  constructor () {
    super()
    this.state = get_state()
  }

  componentDidMount () {
    let self = this
    CredentialsStore.add_change_listener('user-panel', () => {
      self.setState(get_state())
    })
  }

  componentWillUnmount () {
    CredentialsStore.remove_change_listener('user-panel')
  }

  render () {
    let me = this.state.me
    let loading = !me

    return <div className={classNames('user_panel', {loading})}>
      {me
      ? <div>
          <img className='avatar' src={me.cover_url}/>
          <div className='username'>{me.username}</div>
        </div>
      : 'Loading...'}
    </div>
  }
}

UserPanel.propTypes = {
  me: PropTypes.object
}

export {UserPanel}
