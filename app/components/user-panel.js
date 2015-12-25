

let r = require('r-dom')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let remote = require('electron').remote
// TODO: get rid of that, go through app-store instead
let CredentialsStore = remote.require('./stores/credentials-store')

function get_state () {
  return { me: CredentialsStore.get_me() }
}

/**
 * A friendly component that displays your avatar and username
 */
class UserPanel extends ShallowComponent {
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

    let avatar = (me && me.cover_url) || 'static/images/itchio-textless-pink.svg'

    return r.div({classSet: {user_panel: true, loading}}, [
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

module.exports = translate('user-panel')(UserPanel)
