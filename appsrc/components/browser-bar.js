
import React, {Component} from 'react'

import BrowserControls from './browser-controls'

export class BrowserBar extends Component {
  render () {
    return <div className='browser-bar'>
      <div className='controls'>
        <BrowserControls {...this.props}/>
      </div>
    </div>
  }
}

export default BrowserBar
