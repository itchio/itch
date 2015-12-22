'use strict'

let mori = require('mori')
let r = require('r-dom')
let Component = require('./component')

let LoginPage = require('./login').LoginPage
let LibraryPage = require('./library').LibraryPage
let PreferencesPage = require('./preferences').PreferencesPage

let AppStore = require('../stores/app-store')
let AppActions = require('../actions/app-actions')
let defer = require('../util/defer')

function get_state () {
  return {state: AppStore.get_state()}
}

class Layout extends Component {
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

module.exports = {Layout}
