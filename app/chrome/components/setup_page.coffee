
{ div, span } = React.DOM

component = require "./component"
classNames = require "classnames"

module.exports = component {
  displayName: "SetupPage"

  render: ->
    (div { className: classNames(
      "setup_page"
      error: @props.error
    )},
      (div { className: "setup_widget" },
        (div {
          className: classNames(
            "throbber_loader"
          )
        },
          (span { className: "icon icon-#{@props.icon}" })
        )
        (div { className: "setup_message" },
          @props.message
        )
      )
    )
}
