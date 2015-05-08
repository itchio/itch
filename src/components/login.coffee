
R.component "LoginPage", {
  render: ->
    div className: "login_page",
      R.LoginForm {}
}

R.component "LoginForm", {
  getInitialState: ->
    { loading: false }

  handle_submit: (event) ->
    event.preventDefault()

    @setState loading: true

    req = new XMLHttpRequest
    req.onreadystatechange = ->
      if req.readyState == 4
        console.log "it finished:", req.status

    req.open "POST", "http://leafo.net"
    req.send()

  render: ->
    div className: "login_form",
      (img className: "logo", src: "static/images/itchio-white.svg", onClick: -> alert "ehhh")
      (div className: "login_box",
        (h1 {}, "Log in"),
        form className: "form", onSubmit: @handle_submit,
          (R.InputRow {
            label: "Username"
            name: "username"
            type: "text"
            disabled: @state.loading
          }),
          (R.InputRow {
            label: "Password"
            name: "password"
            type: "password"
            disabled: @state.loading
          }),
          (div className: "buttons",
            (button {
              className: "button"
              disabled: if @state.loading then "disabled"
            }, "Log in"),
            " · ",
            (a href: "", "Forgot password")))
}

R.component "InputRow", {
  render: ->
    div className: "input_row",
      (label {},
        (div className: "label", @props.label),
        (input {
          type: @props.type || "text"
          disabled: if @props.disabled then "disabled"
        }))
}

