
import React from 'react'
import {Component, PropTypes} from 'react'
import classNames from 'classnames'

/**
 * A friendly component that displays your avatar and username
 */
class UserPanel extends Component {
  constructor () {
    super()
    this.state = { user: null }
  }

  render () {
    let me = this.props.me
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
