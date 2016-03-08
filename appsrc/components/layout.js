
import {connect} from 'react-redux'
import {Component} from 'react'
import r from 'r-dom'

import LoginPage from './login-page'
// import LibraryPage from './library-page'

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends Component {
  render () {
    const {appState} = this.props

    switch (appState.session.navigation.page) {
      case 'login':
      case 'setup':
        return r(LoginPage, {state: appState})
      case 'library':
        return r.span({style: {color: 'white'}}, 'library page!')
        // return r(LibraryPage, {state: app_state})
      default:
        return r.div()
    }
  }
}

Layout.propTypes = {}

function mapStateToProps (state) {
  return {
    appState: state
  }
}

function mapDispatchToProps (dispatch) {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layout)
