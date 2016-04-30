
import React, {Component} from 'react'
import classNames from 'classnames'

import BrowserControls from './browser-controls'

export class BrowserBar extends Component {
  render () {
    const {browserState} = this.props
    const {loading} = browserState

    const classes = classNames('browser-bar', {loading})

    return <div className={classes}>
      <div className='controls'>
        <BrowserControls {...this.props}/>
      </div>
    </div>
  }
}

export default BrowserBar
