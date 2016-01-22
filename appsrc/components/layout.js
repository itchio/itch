
let r = require('r-dom')
import {get} from 'mori-ext'
let ShallowComponent = require('./shallow-component')

let LoginPage = require('./login-page')
let LibraryPage = require('./library-page')

let AppStore = require('../stores/app-store')
let AppActions = require('../actions/app-actions')
let defer = require('../util/defer')

function get_state () {
  return {state: AppStore.get_state()}
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
    AppStore.add_change_listener('layout', () => {
      defer(() => { this.setState(get_state()) })
    })
  }

  componentWillUnmount () {
    super.componentWillUnmount()
    AppStore.remove_change_listener('layout')
    AppActions.app_implode()
  }

  render () {
    let state = this.state.state

    switch (state::get('page')) {
      case 'login':
      case 'setup':
        return r(LoginPage, {state})
      case 'library':
        return r(LibraryPage, {state})
      default:
        return r.div()
    }
  }
}

Layout.propTypes = {}

module.exports = Layout
