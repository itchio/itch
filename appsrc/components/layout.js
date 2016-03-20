
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import {connect} from 'react-redux'

import GatePage from './gate-page'
import HubPage from './hub-page'

import StatusBar from './status-bar'

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends Component {
  render () {
    return <div className='layout'>
      <div className='layout-main'>
        {this.main()}
      </div>
      <StatusBar/>
    </div>
  }

  main () {
    const {page} = this.props

    switch (page) {
      case 'gate':
        return <GatePage/>
      case 'hub':
        return <HubPage/>
      default:
        return <div>Unknown page: {page}</div>
    }
  }
}

Layout.propTypes = {
  page: PropTypes.string.isRequired
}

const mapStateToProps = createStructuredSelector({
  page: (state) => state.session.navigation.page
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layout)
