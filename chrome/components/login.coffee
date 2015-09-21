
R.component "LoginPage", {
  render: ->
    div className: "login_page",
      R.LoginForm {}
}

R.component "LoginForm", {
  getInitialState: ->
    { loading: false, errors: null }

  after_login: ->
    React.render (R.LibraryPage {}), document.body
    I.set_menu()

  componentDidMount: ->
    I.set_menu()

    @setState loading: true
    I.ItchioApiUser.get_saved_user().then (user) =>
      I.set_current_user user
      @after_login()
    , (errors) =>
      if errors.length
        @setState errors: errors, loading: false
      else
        @setState loading: false

  handle_submit: (event) ->
    event.preventDefault()

    @setState loading: true, errors: null

    username = @refs.username.value()
    password = @refs.password.value()

    I.api().login_with_password(username, password).then (res) =>
      console.log "login", res

      @setState loading: false
      I.set_current_user res.key
      I.current_user().save_login()
      @after_login()
    , (errors) =>
      @setState errors: errors, loading: false

  render: ->
    div className: "login_form",
      (img className: "logo", src: "static/images/itchio-white.svg")
      (div className: "login_box",
        (h1 {}, "Log in"),
        form className: "form", onSubmit: @handle_submit,
          (if @state.errors
            ul className: "form_errors",
              (li {}, error for error in @state.errors )...)
          (R.InputRow {
            label: "Username"
            name: "username"
            type: "text"
            ref: "username"
            autofocus: true
            disabled: @state.loading
          }),
          (R.InputRow {
            label: "Password"
            name: "password"
            type: "password"
            ref: "password"
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
  componentDidMount: ->
    if @props.autofocus
      @refs.input.getDOMNode().focus()

  value: ->
    @refs.input.getDOMNode().value

  render: ->
    div className: "input_row",
      (label {},
        (div className: "label", @props.label),
        (input {
          type: @props.type || "text"
          ref: "input"
          disabled: if @props.disabled then "disabled"
        }))
}

