'use nodent';'use strict'

let React = require('react')
let PropTypes = require('react').PropTypes
let Component = require('./component')
let classNames = require('classnames')

let remote = require('remote')
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

module.exports = {UserPanel}
