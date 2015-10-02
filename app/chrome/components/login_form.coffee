
{ div, img, h1, form, button, a, ul, li } = React.DOM

component = require "./component"
InputRow = require "./input_row"

remote = window.require "remote"
api = remote.require "./metal/api"
AppActions = remote.require "./metal/actions/AppActions"

module.exports = component {
  displayName: "LoginForm"

  handleSubmit: (event) ->
    event.preventDefault()

    username = @refs.username.value()
    password = @refs.password.value()

    AppActions.login_with_password username, password

  render: ->
    errors = @props.errors
    loading = @props.loading

    (div { className: "login_form" },
      (img className: "logo", src: "static/images/itchio-white.svg")
      (div { className: "login_box" },
        (h1 {}, "Log in")

        (form { className: "form", onSubmit: @handleSubmit },
          if errors
            if errors.length
              (ul className: "form_errors",
                errors.map (error, key) ->
                  (li { key }, error)
              )
            else
              (ul className: "form_errors", (li {}, errors))

          (InputRow {
            label: "Username"
            name: "username"
            type: "text"
            ref: "username"
            autofocus: true
            disabled: loading
          })

          (InputRow {
            label: "Password"
            name: "password"
            type: "password"
            ref: "password"
            disabled: loading
          })

          (div { className: "buttons" },
            (button {
              className: "button"
              disabled: if loading then "disabled"
            }, "Log in")

            " · "

            (a { href: "https://itch.io/user/forgot-password", target: "_blank" }, "Forgot password")
          )
        )
      )
    )

}

