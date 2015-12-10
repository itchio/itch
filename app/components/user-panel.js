'use nodent';'use strict'

let r = require('r-dom')
let PropTypes = require('react').PropTypes
let Component = require('./component')

let remote = require('electron').remote
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

    return r.div({classSet: {user_panel: true, loading}}, [
      me
      ? r.div({}, [
        r.img({className: 'avatar', src: me.cover_url}),
        r.div({className: 'username'}, me.username)
      ])
      : 'Loading...'
    ])
  }
}

UserPanel.propTypes = {
  me: PropTypes.object
}

module.exports = {UserPanel}
