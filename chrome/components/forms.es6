
import React from 'react'
import {PropTypes, Component} from 'react'

class InputRow extends Component {
  componentDidMount () {
    if (this.props.autofocus) {
      this.refs.input.getDOMNode().focus()
    }
  }

  render () {
    let {label, type = 'text', disabled} = this.props
    return <div className='input_row'>
      <label>
        <div className='label'>{this.props.label}</div>
        <input type={type} ref='input' disabled={disabled && 'disabled'}/>
      </label>
    </div>
  }

  // non-React methods
  value () {
    return this.refs.input.getDOMNode().value
  }
}

InputRow.propTypes = {
  autofocus: PropTypes.boolean,
  disabled: PropTypes.boolean,
  label: PropTypes.string,
  type: PropTypes.oneOfType(['text', 'password'])
}

export {InputRow}
