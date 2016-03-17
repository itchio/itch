
import React, {PropTypes, Component} from 'react'

import TimeAgo from 'react-timeago'

import defaultImages from '../constants/default-images'

export class RememberedSession extends Component {
  render () {
    const {session} = this.props
    const {me, key} = session
    const {username, coverUrl = defaultImages.avatar} = me

    const onClick = () => this.props.loginWithToken({username, key})

    return <div className='remembered-session' onClick={onClick}>
      <img className='avatar' src={coverUrl}/>
      <div className='rest'>
        <p className='username'>{username}</p>
        <p className='last-connected'>
          Last connected <TimeAgo date={session.lastConnected}/>
        </p>
      </div>
    </div>
  }
}

RememberedSession.propTypes = {
  session: PropTypes.shape({
    key: PropTypes.string,
    me: PropTypes.shape({
      // not so great
      id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
      username: PropTypes.string,
      coverUrl: PropTypes.string
    })
  }),

  loginWithToken: PropTypes.func
}

export default RememberedSession
