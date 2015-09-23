
{ div, img, h1, form, button, a } = React.DOM

component = require "./component"
InputRow = require "./input_row"
menu = require "../itchio/menu"

api = require "../itchio/api"

module.exports = component {
  displayName: "LoginForm"

  getInitialState: ->
    { loading: false, errors: null }

  componentDidMount: ->
    menu.set_menu()

    @setState loading: true
    api.ApiUser.get_saved_user().then (user) =>
      api.set_current_user user
      @after_login()
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

    api.get().login_with_password(username, password).then (res) =>
      console.log "login", res

      @setState loading: false
      api.set_current_user res.key
      api.current_user().saveLogin()
      @after_login()
    , (errors) =>
      @setState errors: errors, loading: false

  render: ->
    (div { className: "login_form" },
      (img className: "logo", src: "static/images/itchio-white.svg")
      (div { className: "login_box" }, [
        (h1 {}, "Log in")

        (form { className: "form", onSubmit: @handleSubmit }, [

          @state.errors and (ul className: "form_errors",
              (li {}, error for error in @state.errors )
          )

          (InputRow {
            label: "Username"
            name: "username"
            type: "text"
            ref: "username"
            autofocus: true
            disabled: @state.loading
          })

          (InputRow {
            label: "Password"
            name: "password"
            type: "password"
            ref: "password"
            disabled: @state.loading
          })

          (div { className: "buttons" }, [
            (button {
              className: "button"
              disabled: if @state.loading then "disabled"
            }, "Log in")

            " · "

            (a { href: "" }, "Forgot password")
          ])
        ])
      ])
    )

  # non-React stuff
  #
  after_login: ->
    LibraryPage = require "./library_page"
    React.render (LibraryPage {}), document.body
    menu.set_menu()

}
