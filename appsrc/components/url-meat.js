
import React, {PropTypes, Component} from 'react'

import BrowserMeat from './browser-meat'

export class UrlMeat extends Component {
  render () {
    const {url} = this.props

    return <BrowserMeat url={url} rookie/>
  }
}

UrlMeat.propTypes = {
  url: PropTypes.string.isRequired
}

export default UrlMeat
