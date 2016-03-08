
import {getIn} from 'grovel'
import r from 'r-dom'
import {PropTypes, Component} from 'react'

import urls from '../constants/urls'

import InputRow from './input-row'
import ErrorList from './error-list'
import Icon from './icon'

import {
  loginWithPassword
} from '../actions'

import store from '../store'

// TODO: get t somewhere
const t = (x) => x

// TODO: handle login failure
class LoginForm extends Component {
  constructor () {
    super()
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleLoginFailure = this.handleLoginFailure.bind(this)
  }

  render () {
    let state = this.props.state || {}
    let {page} = state.session.navigation

    let loading, errors, message, icon

    if (page === 'login') {
      loading = state::getIn(['login', 'loading'])
      errors = state::getIn(['login', 'errors'])
      message = t('login.status.login')
      icon = 'heart-filled'
    } else if (page === 'setup') {
      let setup_msg = state::getIn(['login', 'setup', 'message'])
      let setup_var = state::getIn(['login', 'setup', 'variables'])
      loading = true
      errors = []
      message = t(setup_msg, setup_var)
      icon = state.login.setup.icon
    } else {
      throw new Error(`Unknown page for login form: ${page}`)
    }

    let primary_action = loading ? this.spinner(icon, message) : this.button()

    return (
      r.form({classSet: {form: true, has_error: (icon === 'error')}, onSubmit: this.handleSubmit}, [
        r(ErrorList, {errors, before: r(Icon, {icon: 'neutral'}), i18n_namespace: 'api.login'}),

        r(InputRow, {placeholder: t('login.field.username'), name: 'username', type: 'text', ref: 'username', autofocus: true, disabled: loading}),
        r(InputRow, {placeholder: t('login.field.password'), name: 'password', type: 'password', ref: 'password', disabled: loading}),

        r.div({className: 'buttons'}, [
          primary_action,
          this.secondaryActions()
        ])
      ])
    )
  }

  button () {
    return r.button({className: 'button'}, t('login.action.login'))
  }

  spinner (icon, message) {
    return r.span({className: 'login_status'}, [
      r.span({className: `icon icon-${icon} small_throbber_loader`}),
      message
    ])
  }

  secondaryActions () {
    return r.div({className: 'login_links'}, [
      r.a({
        href: urls.account_register
      }, t('login.action.register')),

      r.span(' · '),

      r.a({
        href: urls.account_forgot_password
      }, t('login.action.reset_password'))
    ])
  }

  handleSubmit (event) {
    event.preventDefault()

    let username = this.refs.username
    let password = this.refs.password
    console.log(`dispatching login for ${username.value()}`)
    store.dispatch(loginWithPassword(username.value(), password.value()))
  }

  handleLoginFailure () {
    let password = this.refs.password
    if (password) { setTimeout(() => password.focus(), 200) }
  }
}

LoginForm.propTypes = {
  state: PropTypes.any
}

export default LoginForm
