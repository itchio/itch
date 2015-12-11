'use strict'

let r = require('r-dom')
let PropTypes = require('react').PropTypes
let Component = require('./component')

class InputRow extends Component {
  componentDidMount () {
    if (this.props.autofocus) {
      this.refs.input.focus()
    }
  }

  render () {
    let name = this.props.name
    let type = this.props.type || 'text'
    let disabled = this.props.disabled

    return (
      r.div({className: 'input-row'}, [
        r.label({}, [
          r.input({type, disabled, ref: 'input', placeholder: name})
        ])
      ])
    )
  }

  // non-React methods
  value () {
    return this.refs.input.value
  }
}

InputRow.propTypes = {
  autofocus: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  type: PropTypes.oneOf(['text', 'password'])
}

module.exports = {InputRow}
