
{ div } = React.DOM
component = require "./component"

module.exports = component {
  displayName: "LibraryPanelLink"

  render: ->
    classes = "panel_link"
    if @props.name == @props.currentPanel
      classes += " current"

    div {
      className: classes
      onClick: =>
        @props.setPanel @props.name
    }, @props.label
}
