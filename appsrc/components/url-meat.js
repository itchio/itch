
import React, {PropTypes, Component} from 'react'

import BrowserMeat from './browser-meat'

export class UrlMeat extends Component {
  render () {
    const {url} = this.props

    return <BrowserMeat url={url}/>
  }
}

UrlMeat.propTypes = {
  url: PropTypes.string
}

export default UrlMeat
