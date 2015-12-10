'use strict'

let r = require('r-dom')
let mori = require('mori')
let React = require('react')
let PropTypes = React.PropTypes
let Component = require('./component')

let Icon = require('./misc').Icon

class SetupPage extends Component {
  render () {
    let state = mori.toJs(this.props.state)
    let icon = state.icon
    let message = state.message
    let error = (icon === 'error')

    return r.div({classSet: {setup_page: true, error}}, [
      r.div({className: 'setup_widget'}, [
        r.div({className: 'throbber_loader'}, [
          r(Icon, {icon})
        ]),
        r.div({className: 'setup_message'}, message)
      ])
    ])
  }
}

SetupPage.propTypes = {
  state: PropTypes.any
}

module.exports = {SetupPage}
