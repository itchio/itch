
import React, {PropTypes, Component} from 'react'

import TimeAgo from 'react-timeago'

import defaultImages from '../constants/default-images'

export class RememberedSession extends Component {
  render () {
    const {session, loginWithToken, forgetSession} = this.props
    const {me, key} = session
    const {username, coverUrl = defaultImages.avatar} = me

    return <div className='remembered-session' onClick={() => loginWithToken({username, key})}>
      <img className='avatar' src={coverUrl}/>
      <div className='rest'>
        <p className='username'>{username}</p>
        <p className='last-connected'>
          Last connected <TimeAgo date={session.lastConnected}/>
        </p>
      </div>
      <div className='filler'/>
      <span className='icon icon-delete forget-session' onClick={(e) => { e.stopPropagation(); forgetSession(me.id) }}/>
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

  loginWithToken: PropTypes.func,
  forgetSession: PropTypes.func
}

export default RememberedSession
