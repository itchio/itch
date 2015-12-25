
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let AppActions = require('../actions/app-actions')

let InputRow = require('./input-row')
let ErrorList = require('./error-list')
let Icon = require('./icon')

class LoginForm extends ShallowComponent {
  constructor () {
    super()
    this.handle_submit = this.handle_submit.bind(this)
  }

  render () {
    let t = this.props.t
    let state = this.props.state
    let page = mori.get(state, 'page')

    let loading, errors, message, icon

    if (page === 'login') {
      loading = mori.getIn(state, ['login', 'loading'])
      errors = mori.getIn(state, ['login', 'errors'])
      message = t('login.status.login')
      icon = 'heart-filled'
    } else if (page === 'setup') {
      let setup_state = mori.getIn(state, ['login', 'setup'])
      let setup_msg = mori.get(setup_state, 'message')
      let setup_var = mori.get(setup_state, 'variables')
      loading = true
      errors = []
      message = t(setup_msg, setup_var)
      icon = mori.get(setup_state, 'icon')
    } else {
      throw new Error(`Unknown page for login form: ${page}`)
    }

    let primary_action = loading ? this.spinner(icon, message) : this.button()

    return (
      r.form({classSet: {form: true, has_error: (icon === 'error')}, onSubmit: this.handle_submit}, [
        r(ErrorList, {errors, before: r(Icon, {icon: 'neutral'}), i18n_namespace: 'api.login'}),

        r(InputRow, {placeholder: t('login.field.username'), name: 'username', type: 'text', ref: 'username', autofocus: true, disabled: loading}),
        r(InputRow, {placeholder: t('login.field.password'), name: 'password', type: 'password', ref: 'password', disabled: loading}),

        r.div({className: 'buttons'}, [
          primary_action,
          this.secondary_actions()
        ])
      ])
    )
  }

  button () {
    let t = this.props.t
    return r.button({className: 'button'}, t('login.action.login'))
  }

  spinner (icon, message) {
    return r.span({className: 'login_status'}, [
      r.span({className: `icon icon-${icon} small_throbber_loader`}),
      message
    ])
  }

  secondary_actions () {
    let t = this.props.t

    return r.div({className: 'login_links'}, [
      r.a({
        href: 'https://itch.io/register'
      }, t('login.action.register')),

      r.span(' · '),

      r.a({
        href: 'https://itch.io/user/forgot-password'
      }, t('login.action.reset_password'))
    ])
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

module.exports = translate('login-form')(LoginForm)
