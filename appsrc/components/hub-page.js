
import React, {Component} from 'react'

import StatusBar from './status-bar'
import HubSidebar from './hub-sidebar'
import HubSidebarHandle from './hub-sidebar-handle'
import HubContent from './hub-content'

export class HubPage extends Component {
  render () {
    return <div className='hub-page'>
      <HubSidebar/>
      <HubSidebarHandle/>
      <HubContent/>
      <StatusBar/>
    </div>
  }
}

export default HubPage
