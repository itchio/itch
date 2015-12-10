'use strict'

let r = require('r-dom')
let React = require('react')
let PropTypes = React.PropTypes
let Component = require('./component')
let mori = require('mori')

let AppActions = require('../actions/app-actions')

let InputRow = require('./forms').InputRow
let ErrorList = require('./misc').ErrorList

class LoginPage extends Component {
  render () {
    return (
      r.div({className: 'login_page'}, [
        r(LoginForm, {state: this.props.state})
      ])
    )
  }
}

LoginPage.propTypes = {
  state: PropTypes.any
}

class LoginForm extends Component {
  constructor () {
    super()
    this.handle_submit = this.handle_submit.bind(this)
  }

  render () {
    let state = this.props.state
    let loading = mori.get(state, 'loading')
    let errors = mori.get(state, 'errors')

    return (
      r.div({className: 'login_form'}, [
        r.img({className: 'logo', src: 'static/images/itchio-white.svg'}),
        r.div({className: 'login_box'}, [
          r.h1('Log in'),

          r.form({className: 'form', onSubmit: this.handle_submit}, [
            r(ErrorList, {errors}),

            r(InputRow, {label: 'Username', name: 'username', type: 'text', ref: 'username', autofocus: true, disabled: loading}),
            r(InputRow, {label: 'Password', name: 'password', type: 'password', ref: 'password', disabled: loading}),

            r.div({className: 'buttons'}, [
              r.button({className: 'button', disabled: loading}, 'Log in'),
              r.span(' · '),
              r.a({href: 'https://itch.io/user/forgot-password', target: '_blank'}, 'Forgot password')
            ])
          ])
        ])
      ])
    )
  }

  handle_submit (event) {
    event.preventDefault()

    let username = this.refs.username
    let password = this.refs.password
    AppActions.login_with_password(username.value(), password.value())
  }
}

LoginForm.propTypes = {
  state: PropTypes.any
}

module.exports = {LoginPage, LoginForm}
