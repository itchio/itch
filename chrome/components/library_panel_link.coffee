
{ div } = React.DOM
component = require "./component"

classNames = require "classnames"

remote = window.require "remote"
AppActions = remote.require "./metal/actions/AppActions"

module.exports = component {
  displayName: "LibraryPanelLink"

  render: ->
    (div {
      className: classNames(
        "panel_link"
        current: @props.data.get("name") == @props.data.get("panel")
      )
      onClick: =>
        AppActions.focus_panel @props.data.get("name")
    }, @props.data.get("label"))
}
