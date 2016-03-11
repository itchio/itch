
import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux'

import urls from '../constants/urls'

import ErrorList from './error-list'
import Icon from './icon'

import localizer from '../localizer'

import {
  loginWithPassword
} from '../actions'

export class GatePage extends Component {
  constructor () {
    super()
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleLoginFailure = this.handleLoginFailure.bind(this)
  }

  render () {
    const {strings, lang, stage, errors, blockingOperation} = this.props
    const t = localizer.getT(strings, lang)

    return <div className='gate-page' data-stage={stage}>
      <section className='top-filler'/>
      <section className='logo'>
        <img src='static/images/bench-itch.png'/>
      </section>

      <section className='errors'>
        <ErrorList errors={errors} before={<Icon icon='neutral'/>} i18nNamespace='api.login'/>
      </section>

      <section className='crux'>
        <form className='form' onSubmit={this.handleSubmit}>
          <input ref='username' type='text' placeholder={t('login.field.username')} autoFocus={true}/>
          <input ref='password' type='password' placeholder={t('login.field.password')}/>
          <section className='actions'>
            {this.renderActions(blockingOperation)}
          </section>
        </form>
      </section>

      <section className='links'>
        <a href={urls.accountRegister}>{t('login.action.register')}</a>
        <span>{' · '}</span>
        <a href={urls.accountForgotPassword}>{t('login.action.reset_password')}</a>
      </section>
    </div>
  }

  renderActions (blockingOperation) {
    const t = (x) => x

    if (blockingOperation) {
      const {message, icon} = blockingOperation
      const translatedMessage = t.apply(null, message)

      return <p>
        <span className={`icon icon-${icon}`}/>
        {translatedMessage}
      </p>
    } else {
      const translatedMessage = t('login.action.login')
      return <input type='submit' value={translatedMessage}/>
    }
  }

  componentWillReceiveProps (nextProps) {
    // so very reacty...
    if (!nextProps.loading && nextProps.errors.length) {
      this.handleLoginFailure()
    }
  }

  handleSubmit (e) {
    e.preventDefault()
    const {username, password} = this.refs
    this.props.loginWithPassword(username.value, password.value)
  }

  handleLoginFailure () {
    const {password} = this.refs
    if (password) {
      setTimeout(() => password.focus(), 200)
    }
  }
}

GatePage.propTypes = {
  stage: PropTypes.string,
  errors: PropTypes.array,
  blockingOperation: PropTypes.shape({
    message: PropTypes.array,
    icon: PropTypes.string
  }),
  loginWithPassword: PropTypes.func.isRequired,
  strings: PropTypes.object,
  lang: PropTypes.string
}

const mapStateToProps = (state) => {
  let base
  if (state.session.credentials.key) {
    base = {stage: 'setup', ...state.setup}
  } else {
    base = {stage: 'login', ...state.session.login}
  }
  return {...base, strings: state.i18n.strings, lang: state.session.preferences.lang}
}

const mapDispatchToProps = (dispatch) => ({
  loginWithPassword: (username, password) => dispatch(loginWithPassword({username, password}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GatePage)
