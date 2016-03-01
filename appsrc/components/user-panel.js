
import r from 'r-dom'
import {PropTypes} from 'react'
import ShallowComponent from './shallow-component'

/**
 * A friendly component that displays your avatar and username
 */
class UserPanel extends ShallowComponent {
  constructor () {
    super()
  }

  render () {
    let state = this.props.state
    let me = state.credentials.me

    let avatar = me.cover_url || 'static/images/itchio-textless-pink.svg'

    return r.div({classSet: {user_panel: true}}, [
      me
      ? r.div({}, [
        r.img({className: 'avatar', src: avatar}),
        r.div({className: 'username'}, me.username)
      ])
      : 'Loading...'
    ])
  }
}

UserPanel.propTypes = {
  me: PropTypes.object
}

export default UserPanel
