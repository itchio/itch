
R.component "LoginPage", {
  render: ->
    div className: "login_page",
      R.LoginForm {}
}

R.component "LoginForm", {
  getInitialState: ->
    { loading: false, errors: null }

  afterLogin: ->
    React.render (R.LibraryPage {}), document.body
    I.setMenu()

  componentDidMount: ->
    I.setMenu()

    @setState loading: true
    I.ItchioApiUser.getSavedUser().then (user) =>
      I.setCurrentUser user
      @afterLogin()
    , (errors) =>
      if errors.length
        @setState errors: errors, loading: false
      else
        @setState loading: false

  handleSubmit: (event) ->
    event.preventDefault()

    @setState loading: true, errors: null

    username = @refs.username.value()
    password = @refs.password.value()

    I.api().loginWithPassword(username, password).then (res) =>
      console.log "login", res

      @setState loading: false
      I.setCurrentUser res.key
      I.currentUser().saveLogin()
      @afterLogin()
    , (errors) =>
      @setState errors: errors, loading: false

  render: ->
    div className: "login_form",
      (img className: "logo", src: "static/images/itchio-white.svg")
      (div className: "login_box",
        (h1 {}, "Log in"),
        form className: "form", onSubmit: @handleSubmit,
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

