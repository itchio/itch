
let r = require('r-dom')
let mori = require('mori')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let LoginForm = require('./login-form')

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

module.exports = translate('login-page')(LoginPage)
