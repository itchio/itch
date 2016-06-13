
import React, {Component} from 'react'

import HubSidebar from './hub-sidebar'
import HubSidebarHandle from './hub-sidebar-handle'
import HubContent from './hub-content'

export class HubPage extends Component {
  render () {
    return <div className='hub-page'>
      <HubSidebar/>
      <HubSidebarHandle/>
      <HubContent/>
    </div>
  }
}

export default HubPage
