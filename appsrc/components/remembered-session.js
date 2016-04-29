
import React, {PropTypes, Component} from 'react'

import TimeAgo from 'react-timeago'

import defaultImages from '../constants/default-images'

export class RememberedSession extends Component {
  render () {
    const {session, loginWithToken, forgetSessionRequest} = this.props
    const {me, key} = session
    const {id, username, coverUrl = defaultImages.avatar} = me

    const onForget = (e) => {
      e.stopPropagation()
      forgetSessionRequest({id, username})
    }

    return <div className='remembered-session' onClick={() => loginWithToken({username, key, me})}>
      <img className='avatar' src={coverUrl}/>
      <div className='rest'>
        <p className='username'>{username}</p>
        <p className='last-connected'>
          Last connected <TimeAgo date={session.lastConnected}/>
        </p>
      </div>
      <div className='filler'/>
      <span className='hint--left' data-hint='Forget this session'>
        <span className='icon icon-delete forget-session' onClick={onForget}/>
      </span>
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
  forgetSessionRequest: PropTypes.func
}

export default RememberedSession
