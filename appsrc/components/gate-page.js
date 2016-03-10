
import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux'

import urls from '../constants/urls'

import ErrorList from './error-list'
import Icon from './icon'

import {
  loginWithPassword
} from '../actions'

// TODO: get t somewhere
const t = (x) => x

export class GatePage extends Component {
  constructor () {
    super()
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleLoginFailure = this.handleLoginFailure.bind(this)
  }

  render () {
    const {stage, errors, blockingOperation} = this.props
    console.log(`blockingOperation = `, blockingOperation)

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
  loginWithPassword: PropTypes.func.isRequired
}

const mapStateToProps = (state) => {
  console.log(`mapping state to props...`)
  if (state.session.credentials.key) {
    return {stage: 'setup', ...state.setup}
  } else {
    return {stage: 'login', ...state.session.login}
  }
}

const mapDispatchToProps = (dispatch) => ({
  loginWithPassword: (username, password) => dispatch(loginWithPassword({username, password}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GatePage)
