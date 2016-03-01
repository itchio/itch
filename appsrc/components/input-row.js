
const r = require('r-dom')
const PropTypes = require('react').PropTypes
const ShallowComponent = require('./shallow-component')

/**
 * Basically a text field, name isn't ideal.
 */
class InputRow extends ShallowComponent {
  componentDidMount () {
    super.componentDidMount()
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

  focus () {
    this.refs.input.focus()
  }
}

InputRow.propTypes = {
  autofocus: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  type: PropTypes.oneOf(['text', 'password'])
}

module.exports = InputRow
