
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let DeepComponent = require('./deep-component')

/**
 * A drop-down you can select from
 * TODO: turn into shallow component (immutable options?)
 */
class SelectRow extends DeepComponent {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      value: this.props.value
    }
  }

  handleChange (event) {
    // TODO not sure I like it
    this.setState({value: event.target.value})
    let on_change = this.props.on_change
    if (on_change) { on_change(event.target.value) }
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

// XXX: can't use translate because it doesn't pass refs
module.exports = SelectRow
