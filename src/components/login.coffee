
R.component "LoginPage", {
  render: ->

    div className: "login_page", [
      R.LoginForm {}
    ]
}

R.component "LoginForm", {
  render: ->
    div className: "login_form", [
      img className: "logo", src: "static/images/itchio-white.svg"
      div className: "login_box", [
        h1 {}, "Log in"
        form className: "form", [
          R.InputRow label: "Username", name: "username", type: "text"
          R.InputRow label: "Password", name: "password", type: "password"
          div className: "buttons", [
            button className: "button", "Log in"
            " · "
            a href: "", "Forgot password"
          ]
        ]
      ]
    ]
}

R.component "InputRow", {
  render: ->
    div className: "input_row", [
      label {}, [
        div className: "label", @props.label
        input type: @props.type || "text"
      ]
    ]
}

