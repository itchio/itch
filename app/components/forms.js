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
    let label = this.props.label || ''
    let type = this.props.type || 'text'
    let disabled = this.props.disabled

    return (
      r.div({className: 'input-row'}, [
        r.label({}, [
          label,
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

class SelectRow extends Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      value: this.props.value
    }
  }

  handleChange (event) {
    this.setState({value: event.target.value})
  }

  render () {
    let options = this.props.options
    let value = this.state.value
    let label = this.props.label || ''

    return (
      r.div({className: 'select-row'}, [
        r.label({}, [
          label,
          r.select({ref: 'input', value: value, onChange: this.handleChange}, options.map((option, index) => r.option({value: option.value}, option.label)))
        ])
      ])
    )
  }

  value () {
    return this.refs.input.value
  }
}

SelectRow.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string,
  label: PropTypes.string.isRequired
}

module.exports = { InputRow, SelectRow }
