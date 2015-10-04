
{ div, span } = React.DOM

component = require "./component"

module.exports = component {
  displayName: "SetupPage"

  render: ->
    (div { className: "setup_page" },
      (div { className: "setup_widget" },
        (div { className: "throbber_loader" })
        (div { className: "setup_message" }, @props.message)
      )
    )
}
