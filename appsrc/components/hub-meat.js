
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {pathToId} from '../util/navigation'
import {createSelector, createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import HubSearchResults from './hub-search-results'

import Downloads from './downloads'
import Preferences from './preferences'
import History from './history'
import FeaturedMeat from './featured-meat'
import Location from './location'
import UrlMeat from './url-meat'
import Dashboard from './dashboard'
import Library from './library'
import NewTab from './new-tab'

import {map} from 'underline'

export class HubMeat extends Component {
  render () {
    const {tabs, id: currentId} = this.props

    return <div className='hub-meat'>
      {tabs::map((tab, i) => {
        const {id, path} = tab
        const visible = (id === currentId)
        const classes = classNames('hub-meat-tab', {visible})
        return <div key={id || path} className={classes}>{this.renderTab(id, path)}</div>
      })}
      <HubSearchResults/>
    </div>
  }

  renderTab (tabId, path) {
    if (path === 'featured') {
      return <FeaturedMeat/>
    } else if (path === 'dashboard') {
      return <Dashboard/>
    } else if (path === 'library') {
      return <Library/>
    } else if (path === 'downloads') {
      return <Downloads/>
    } else if (path === 'history') {
      return <History/>
    } else if (path === 'preferences') {
      return <Preferences/>
    } else if (/^locations/.test(path)) {
      const location = pathToId(path)
      return <Location locationName={location}/>
    } else if (/^new/.test(path)) {
      return <NewTab tabId={tabId}/>
    } else if (/^(url|games|users|collections|search|press)/.test(path)) {
      return <UrlMeat key={tabId} tabId={tabId} path={path}/>
    } else {
      return '?'
    }
  }
}

HubMeat.propTypes = {
  id: PropTypes.string.isRequired,
  me: PropTypes.object,
  games: PropTypes.object,
  myGameIds: PropTypes.array,
  downloadKeys: PropTypes.object,
  tabs: PropTypes.array
}

const allTabsSelector = createSelector(
  (state) => state.session.navigation.tabs,
  (tabs) => tabs.constant.concat(tabs.transient)
)

const mapStateToProps = createStructuredSelector({
  id: (state) => state.session.navigation.id,
  tabs: (state) => allTabsSelector(state),
  me: (state) => state.session.credentials.me
})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubMeat)
