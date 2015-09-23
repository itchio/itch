
{ div, label, input } = React.DOM

component = require "./component"

module.exports = component {
  displayName: "InputRow"

  componentDidMount: ->
    if @props.autofocus
      @refs.input.getDOMNode().focus()

  value: ->
    @refs.input.getDOMNode().value

  render: ->
    div className: "input_row",
      (label {},
        (div className: "label", @props.label),
        (input {
          type: @props.type || "text"
          ref: "input"
          disabled: if @props.disabled then "disabled"
        }))
}

