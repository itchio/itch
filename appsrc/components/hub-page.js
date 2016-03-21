
import React, {Component} from 'react'

import StatusBar from './status-bar'
import HubSidebar from './hub-sidebar'
import HubContent from './hub-content'

export class HubPage extends Component {
  render () {
    return <div className='hub-page'>
      <HubSidebar/>
      <HubContent/>
      <StatusBar/>
    </div>
  }
}

export default HubPage
