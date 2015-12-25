
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

/**
 * Basically a text field, name isn't ideal.
 */
class InputRow extends ShallowComponent {
  componentDidMount () {
    if (this.props.autofocus) {
      this.refs.input.focus()
    }
  }

  render () {
    let name = this.props.name
    let label = this.props.label || ''
    let type = this.props.type || 'text'
    let disabled = this.props.disabled
    let placeholder = this.props.placeholder || name

    return (
      r.div({className: 'input-row'}, [
        r.label({}, [
          label,
          r.input({type, disabled, ref: 'input', placeholder})
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

module.exports = InputRow
