
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import {pathToId} from '../util/navigation'
import urls from '../constants/urls'

import BrowserMeat from './browser-meat'
import querystring from 'querystring'

export class UrlMeat extends Component {
  render () {
    const {path, tabData = {}} = this.props

    let url = 'about:blank'
    let controls = 'generic'

    if (/^url/.test(path)) {
      url = pathToId(path)
    } else if (/^games/.test(path)) {
      const gameId = +pathToId(path)
      const game = (tabData.games || {})[gameId]
      if (game) {
        url = game.url
        controls = 'game'
      }
    } else if (/^users/.test(path)) {
      const userId = +pathToId(path)
      const user = (tabData.users || {})[userId]
      if (user) {
        url = user.url
        controls = 'user'
      }
    } else if (/^collection/.test(path)) {
      const collectionId = +pathToId(path)
      url = urls.itchio + '/c/' + collectionId + '/x'
    } else if (/^search/.test(path)) {
      const q = pathToId(path)
      url = urls.itchio + '/search?' + querystring.stringify({q})
    }

    return <BrowserMeat url={url} tabPath={path} tabData={tabData} controls={controls}/>
  }
}

UrlMeat.propTypes = {
  path: PropTypes.string.isRequired,
  tabId: PropTypes.string.isRequired,
  tabData: PropTypes.object
}

const mapStateToProps = (state, props) => ({
  tabData: state.session.navigation.tabData[props.path]
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UrlMeat)
