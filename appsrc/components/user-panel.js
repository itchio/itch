
let r = require('r-dom')
import {getIn, get} from 'mori-ext'
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

/**
 * A friendly component that displays your avatar and username
 */
class UserPanel extends ShallowComponent {
  constructor () {
    super()
  }

  render () {
    let state = this.props.state
    let me = state::getIn(['credentials', 'me'])

    let avatar = me::get('cover_url') || 'static/images/itchio-textless-pink.svg'

    return r.div({classSet: {user_panel: true}}, [
      me
      ? r.div({}, [
        r.img({className: 'avatar', src: avatar}),
        r.div({className: 'username'}, me::get('username'))
      ])
      : 'Loading...'
    ])
  }
}

UserPanel.propTypes = {
  me: PropTypes.object
}

module.exports = UserPanel
