
let r = require('r-dom')
let mori = require('mori')
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
    let me = mori.getIn(state, ['credentials', 'me'])

    let avatar = mori.get(me, 'cover_url') || 'static/images/itchio-textless-pink.svg'

    return r.div({classSet: {user_panel: true}}, [
      me
      ? r.div({}, [
        r.img({className: 'avatar', src: avatar}),
        r.div({className: 'username'}, mori.get(me, 'username'))
      ])
      : 'Loading...'
    ])
  }
}

UserPanel.propTypes = {
  me: PropTypes.object
}

module.exports = UserPanel
