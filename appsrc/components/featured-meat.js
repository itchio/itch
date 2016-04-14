
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import urls from '../constants/urls'
import BrowserMeat from './browser-meat'

export class FeaturedMeat extends Component {
  render () {
    const browserProps = {}
    return <BrowserMeat className='featured-meat' url={urls.itchio} {...browserProps}/>
  }
}

FeaturedMeat.propTypes = {
  gameId: PropTypes.number
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (state) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FeaturedMeat)
