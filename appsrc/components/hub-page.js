
import {connect} from 'react-redux'
import React, {Component} from 'react'

import StatusBar from './status-bar'
import HubSidebar from './hub-sidebar'
import HubContent from './hub-content'

export class HubPage extends Component {
  render () {
    return <div className='hub_page'>
      <HubSidebar/>
      <HubContent/>
      <StatusBar/>
    </div>
  }
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubPage)
