
{ div } = React.DOM
component = require "./component"

module.exports = component {
  displayName: "LibraryPanelLink"

  render: ->
    classes = "panel_link"
    if @props.name == @props.current_panel
      classes += " current"

    (div {
      className: classes
      onClick: =>
        @props.set_panel @props.name
    }, @props.label)
}
