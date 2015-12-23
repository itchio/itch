'use strict'

let r = require('r-dom')
let mori = require('mori')
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let LoginPage = require('./login-page')
let LibraryPage = require('./library-page')
let PreferencesPage = require('./preferences-page')

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
    AppStore.add_change_listener('layout', () => {
      defer(() => { this.setState(get_state()) })
    })
  }

  componentWillUnmount () {
    AppStore.remove_change_listener('layout')
    AppActions.app_implode()
  }

  render () {
    let state = this.state.state

    switch (mori.get(state, 'page')) {
      case 'login':
      case 'setup':
        // TODO: 'setup' page is deprecated, make sure we can remove the line above.
        return r(LoginPage, {state})
      case 'library':
        return r(LibraryPage, {state: mori.get(state, 'library'), update: mori.get(state, 'update')})
      case 'preferences':
        return r(PreferencesPage, {state})
      default:
        return r.div()
    }
  }
}

Layout.propTypes = {}

module.exports = translate('layout')(Layout)
