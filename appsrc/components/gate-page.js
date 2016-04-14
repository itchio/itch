
import classNames from 'classnames'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import {map, sortBy} from 'underline'

import urls from '../constants/urls'

import ErrorList from './error-list'
import Icon from './icon'

import RememberedSession from './remembered-session'

import * as actions from '../actions'

export class GatePage extends Component {
  constructor () {
    super()
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleLoginFailure = this.handleLoginFailure.bind(this)
  }

  render () {
    const {t, stage, blockingOperation} = this.props
    const disabled = !!blockingOperation

    const classes = classNames('gate-page', {disabled})

    return <div className={classes} data-stage={stage}>
      <section className='top-filler'/>
      <section className='logo'>
        <img src='static/images/logos/itchio-white.svg'/>
      </section>

      {this.errors()}

      <section className='crux'>
        <form onSubmit={this.handleSubmit}>
          <input id='login-username' ref='username' type='text' placeholder={t('login.field.username')} autoFocus disabled={disabled}/>
          <input ref='password' type='password' placeholder={t('login.field.password')} disabled={disabled}/>
          <section className='actions'>
            {this.renderActions()}
          </section>
        </form>
      </section>

      {this.links()}
    </div>
  }

  errors () {
    const {t, errors, stage} = this.props

    if (stage === 'pick') {
      return <section className='errors'>
        <span className='welcome-back'>
          <Icon icon='heart-filled'/>
          {t('login.messages.welcome_back')}
        </span>
      </section>
    } else {
      return <section className='errors'>
        <ErrorList errors={errors} before={<Icon icon='neutral'/>} i18nNamespace='api.login'/>
      </section>
    }
  }

  links () {
    const {t, stage} = this.props

    if (stage === 'pick') {
      const onClick = () => {
        this.props.loginStopPicking()
      }

      return <section className='links'>
        <span className='link' onClick={onClick}>Sign in as someone else</span>
      </section>
    } else {
      const {rememberedSessions = {}} = this.props
      const numSavedSessions = Object.keys(rememberedSessions).length

      return <section className='links'>
        <a className='link' href={urls.accountRegister}>{t('login.action.register')}</a>
        <span>{' · '}</span>
        <a className='link' href={urls.accountForgotPassword}>{t('login.action.reset_password')}</a>
        {numSavedSessions > 0
        ? [
          <span>{' · '}</span>,
          <span className='link' onClick={() => this.props.loginStartPicking()}>Saved logins</span>
        ]
        : ''}
      </section>
    }
  }

  renderActions () {
    const {t, blockingOperation, rememberedSessions = {}, stage, retrySetup} = this.props

    if (stage === 'pick') {
      const onLogin = (payload) => {
        const {username} = this.refs
        if (username) {
          username.val = payload.username
        }
        this.props.loginWithToken(payload)
      }

      const onForget = this.props.forgetSessionRequest

      return <div className='remembered-sessions'>
        {rememberedSessions::sortBy((x) => -x.lastConnected)::map((session, userId) =>
          <RememberedSession key={userId} session={session} loginWithToken={onLogin} forgetSessionRequest={onForget}/>
        )}
      </div>
    } if (blockingOperation) {
      const {message, icon} = blockingOperation
      const translatedMessage = t.format(message)
      const hasError = icon === 'error'
      const classes = classNames(`icon icon-${icon}`, {scanning: !hasError})
      const pClasses = classNames('status-container', {error: hasError})

      return <p className={pClasses}>
        <span className={classes}/>
        {translatedMessage}
        { hasError
          ? <span className='icon icon-repeat retry-setup' onClick={retrySetup}/>
          : '' }
      </p>
    } else {
      const translatedMessage = t('login.action.login')
      return <input type='submit' value={translatedMessage}/>
    }
  }

  componentWillReceiveProps (nextProps) {
    // so very reacty...
    if (!nextProps.loading && nextProps.errors && nextProps.errors.length) {
      this.handleLoginFailure()
    }

    if (this.props.stage === 'pick' && nextProps.stage === 'login') {
      this.handleStoppedPicking()
    }
  }

  handleSubmit (e) {
    e.preventDefault()
    const {username, password} = this.refs
    this.props.loginWithPassword(username.value, password.value)
  }

  handleStoppedPicking () {
    const {username} = this.refs
    if (username) {
      setTimeout(() => username.focus(), 200)
    }
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
  rememberedSessions: PropTypes.object,

  t: PropTypes.func,
  loginWithPassword: PropTypes.func.isRequired,
  loginWithToken: PropTypes.func.isRequired,
  loginStartPicking: PropTypes.func.isRequired,
  loginStopPicking: PropTypes.func.isRequired,
  forgetSessionRequest: PropTypes.func.isRequired,
  retrySetup: PropTypes.func.isRequired
}

const mapStateToProps = (state) => {
  const {rememberedSessions, session} = state
  const {login} = session

  if (!session.credentials.key) {
    const hasSessions = Object.keys(rememberedSessions).length > 0
    const stage = (!login.blockingOperation && hasSessions && login.picking) ? 'pick' : 'login'
    return {...login, stage, rememberedSessions}
  } else if (!state.setup.done) {
    return {stage: 'setup', ...state.setup}
  } else {
    return {stage: 'ready', errors: [], blockingOperation: null}
  }
}

const mapDispatchToProps = (dispatch) => ({
  loginWithPassword: (username, password) => dispatch(actions.loginWithPassword({username, password})),
  loginWithToken: (payload) => dispatch(actions.loginWithToken(payload)),
  loginStartPicking: () => dispatch(actions.loginStartPicking()),
  loginStopPicking: () => dispatch(actions.loginStopPicking()),
  forgetSessionRequest: (payload) => dispatch(actions.forgetSessionRequest(payload)),
  retrySetup: () => dispatch(actions.retrySetup())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GatePage)
