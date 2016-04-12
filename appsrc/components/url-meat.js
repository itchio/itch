
import React, {PropTypes, Component} from 'react'

import BrowserMeat from './browser-meat'

export class UrlMeat extends Component {
  render () {
    const {path, url} = this.props

    return <BrowserMeat url={url} path={path}/>
  }
}

UrlMeat.propTypes = {
  url: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
}

export default UrlMeat
