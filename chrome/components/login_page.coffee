
{ div } = React.DOM

component = require "./component"
LoginForm = require "./login_form"

module.exports = component {
  displayName: "LoginPage"

  render: ->
    div className: "login_page",
      LoginForm {}
}

