'use nodent';'use strict'

let React = require('react')
let PropTypes = require('react').PropTypes
let Component = require('./component')

class InputRow extends Component {
  componentDidMount () {
    if (this.props.autofocus) {
      this.refs.input.focus()
    }
  }

  render () {
    let {label, type = 'text', disabled} = this.props
    return <div className='input_row'>
      <label>
        <div className='label'>{label}</div>
        <input type={type} ref='input' disabled={disabled}/>
      </label>
    </div>
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
  type: PropTypes.oneOfType(['text', 'password'])
}

export {InputRow}
