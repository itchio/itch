'use nodent';'use strict'

let React = require('react')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let Component = require('./component')
let classNames = require('classnames')

let Icon = require('./misc').Icon

class SetupPage extends Component {
  render () {
    let state = mori.toJs(this.props.state)
    let icon = state.icon
    let message = state.message
    let error = (icon === 'error')

    return <div className={classNames('setup_page', {error})}>
      <div className='setup_widget'>
        <div className='throbber_loader'>
          <Icon {...{icon}}/>
        </div>
        <div className='setup_message'>
          <div className='setup_message'>{message}</div>
        </div>
      </div>
    </div>
  }
}

SetupPage.propTypes = {
  state: PropTypes.any
}

module.exports = {SetupPage}
