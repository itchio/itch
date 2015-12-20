'use strict'

let r = require('r-dom')
let React = require('react')
let PropTypes = React.PropTypes
let Component = require('./component')
let mori = require('mori')

let AppActions = require('../actions/app-actions')

let InputRow = require('./forms').InputRow
let misc = require('./misc')

class LoginPage extends Component {
  render () {
    let state = this.props.state

    return (
      r.div({className: 'login_page'}, [
        r.div({className: 'login_form'}, [
          r.img({className: 'logo', src: 'static/images/bench-itch.png'}),
          r.div({className: 'login_box'}, [
            r(LoginForm, {
              page: mori.get(state, 'page'),
              login_state: mori.get(state, 'login'),
              setup_state: mori.get(state, 'setup')
            })
          ])
        ])
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
    let page = this.props.page
    let login_state = this.props.login_state
    let setup_state = this.props.setup_state

    // FIXME wouldn't all that imperative logic be very well suited
    // for a refactoring? why yes, yes it would. — A
    let loading = (
      page === 'login'
      ? mori.get(login_state, 'loading')
      : true
    )
    let errors = mori.get((
      page === 'login'
      ? login_state
      : setup_state
    ), 'errors')

    let icon = (
      page === 'login'
      ? 'heart-filled'
      : mori.get(setup_state, 'icon')
    )

    let message = (
      page === 'login'
      ? 'Contacting dovecote'
      : mori.get(setup_state, 'message')
    )

    return (
      r.form({classSet: {form: true, has_error: (icon === 'error')}, onSubmit: this.handle_submit}, [
        r(misc.ErrorList, {errors, before: r(misc.Icon, {icon: 'neutral'})}),

        r(InputRow, {name: 'username', type: 'text', ref: 'username', autofocus: true, disabled: loading}),
        r(InputRow, {name: 'password', type: 'password', ref: 'password', disabled: loading}),

        r.div({className: 'buttons'}, [
          (loading
          ? r.span({className: 'login_status'}, [r.span({className: `icon icon-${icon} small_throbber_loader`}), message])
          : r.button({className: 'button'}, 'Log in')),
          r.div({className: 'login_links'}, [
            r.a({href: 'https://itch.io/register', target: '_blank'}, 'register'),
            r.span(' · '),
            r.a({href: 'https://itch.io/user/forgot-password', target: '_blank'}, 'forgot password')
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
