
import React from 'react'
import {Component, PropTypes} from 'react'

import AppActions from '../actions/app_actions'

import {InputRow} from './forms'
import {ErrorList} from './misc'

export class LoginPage extends Component {
  render () {
    return <div className='login_page'>
      <LoginForm {...this.props}/>
    </div>
  }
}

class LoginForm extends Component {
  constructor () {
    super()
    this.handle_submit = this.handle_submit.bind(this)
  }

  render () {
    console.log(this.props)
    let {loading, errors} = this.props

    return <div className='login_form'>
      <img className='logo' src='static/images/itchio-white.svg'/>
      <div className='login_box'>
        <h1>Log in</h1>

        <form className='form' onSubmit={this.handle_submit}>
          <ErrorList {...{errors}}/>

          <InputRow label='Username' name='username' type='text' ref='username' autofocus disabled={loading}/>
          <InputRow label='Password' name='password' type='password' ref='password' disabled={loading}/>

          <div className='buttons'>
            <button className='button' disabled={loading}>Log in</button>
            <span> · </span>
            <a href='https://itch.io/user/forgot-password' target='_blank'>Forgot password</a>
          </div>
        </form>
      </div>
    </div>
  }

  handle_submit (event) {
    event.preventDefault()

    let {username, password} = this.refs
    AppActions.login_with_password(username.value(), password.value())
  }
}

LoginForm.propTypes = {
  loading: PropTypes.bool,
  errors: PropTypes.array
}
