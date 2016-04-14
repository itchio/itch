
import React, {PropTypes, Component} from 'react'

import {map} from 'underline'

/**
 * A drop-down you can select from
 */
class SelectRow extends Component {
  constructor (props) {
    super(props)
    this.onChange = ::this.onChange
  }

  onChange (event) {
    const {onChange} = this.props
    if (onChange) {
      onChange(event.target.value)
    }
  }

  render () {
    let options = this.props.options
    let value = this.props.value
    let label = this.props.label || ''

    const optionTags = options::map((option, index) =>
      <option value={option.value}>{option.label}</option>
    )

    return <div className='select-row'>
      <label>
        {label}
        <select ref='input' value={value} onChange={this.onChange}>
          {optionTags}
        </select>
      </label>
    </div>
  }

  value () {
    return this.refs.input.value
  }
}

SelectRow.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func
}

export default SelectRow
