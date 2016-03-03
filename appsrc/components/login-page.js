
import r from 'r-dom'
import {PropTypes} from 'react'
import ShallowComponent from './shallow-component'

import LoginForm from './login-form'

/**
 * The 'login' state of the application, during which
 * setup also happens.
 */
class LoginPage extends ShallowComponent {
  render () {
    let state = this.props.state

    return (
      r.div({className: 'login_page'}, [
        r.div({className: 'login_form'}, [
          r.img({className: 'logo', src: 'static/images/bench-itch.png'}),
          r.div({className: 'login_box'}, [
            r(LoginForm, {state})
          ])
        ])
      ])
    )
  }
}

LoginPage.propTypes = {
  state: PropTypes.any
}

export default LoginPage
