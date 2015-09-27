
{ div, span } = React.DOM
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
        current: @props.name == @props.panel
      )
      onClick: =>
        AppActions.focus_panel @props.name
    },
      if @props.icon
        (span {},
          span { className: "icon icon-#{@props.icon}" }
          " "
        )
      @props.label
      if @props.progress
        (div { className: "progress_outer" },
          (div {
            className: "progress_inner"
            style: {
              width: "#{@props.progress * 100}%"
            }
          })
        )
    )
}
