
import r from 'r-dom'
import {PropTypes} from 'react'
import ShallowComponent from './shallow-component'

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
    const {name, label = '', type = 'text', disabled} = this.props
    const {placeholder = name} = this.props

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

export default InputRow
