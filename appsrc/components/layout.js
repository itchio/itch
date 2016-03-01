
let r = require('r-dom')
let ShallowComponent = require('./shallow-component')

let LoginPage = require('./login-page')
let LibraryPage = require('./library-page')

let AppStore = require('../stores/app-store')
let AppActions = require('../actions/app-actions')

function get_state () {
  return {app_state: AppStore.get_state()}
}

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends ShallowComponent {
  constructor () {
    super()
    this.state = get_state()
  }

  componentDidMount () {
    super.componentDidMount()
    AppStore.add_change_listener('layout', (app_state) => {
      pre: { // eslint-disable-line
        typeof app_state === 'object'
      }

      this.setState({app_state})
    })
  }

  componentWillUnmount () {
    super.componentWillUnmount()
    AppStore.remove_change_listener('layout')
    AppActions.implode_app()
  }

  render () {
    const {app_state} = this.state

    switch (app_state.page) {
      case 'login':
      case 'setup':
        return r(LoginPage, {state: app_state})
      case 'library':
        return r(LibraryPage, {state: app_state})
      default:
        return r.div()
    }
  }
}

Layout.propTypes = {}

module.exports = Layout
