
import r from 'r-dom'
import ShallowComponent from './shallow-component'

import LoginPage from './login-page'
import LibraryPage from './library-page'

import ChromeStore from '../stores/chrome-store'
import AppActions from '../actions/app-actions'

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends ShallowComponent {
  constructor () {
    super()
    this.state = {app_state: ChromeStore.get_state()}
  }

  componentDidMount () {
    super.componentDidMount()
    ChromeStore.add_change_listener('layout', (app_state) => {
      pre: { // eslint-disable-line
        typeof app_state === 'object'
      }

      this.setState({app_state})
    })
  }

  componentWillUnmount () {
    super.componentWillUnmount()
    ChromeStore.remove_change_listener('layout')
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

export default Layout
