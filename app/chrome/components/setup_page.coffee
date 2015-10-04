
{ div, span } = React.DOM

component = require "./component"
classNames = require "classnames"

module.exports = component {
  displayName: "SetupPage"

  render: ->
    (div { className: "setup_page" },
      (div { className: "setup_widget" },
        (div {
          className: classNames(
            "throbber_loader"
            still: @props.error
          )
        })
        (div { className: classNames(
          "setup_message"
          error: @props.error
        )},
          if @props.error
            (span { className: "icon icon-error" })
          else
            (span { className: "icon icon-settings" })
          @props.message
        )
      )
    )
}
