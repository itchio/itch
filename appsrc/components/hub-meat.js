
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {pathToId} from '../util/navigation'
import {createSelector, createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import HubSearchResults from './hub-search-results'

import Downloads from './downloads'
import Preferences from './preferences'
import History from './history'
import Location from './location'
import UrlMeat from './url-meat'
import Dashboard from './dashboard'
import Library from './library'
import Collections from './collections'
import Collection from './collection'
import NewTab from './new-tab'

import {map} from 'underline'

export class HubMeat extends Component {
  render () {
    const {tabData, tabs, id: currentId} = this.props

    return <div className='hub-meat'>
      {tabs::map((id, i) => {
        const data = tabData[id]
        if (!data) {
          return
        }
        const {path} = data
        const visible = (id === currentId)
        const classes = classNames('hub-meat-tab', {visible})
        return <div key={id} className={classes}>
          {this.renderTab(id, path, data, visible)}
        </div>
      })}
      <HubSearchResults/>
    </div>
  }

  renderTab (tabId, path, data, visible) {
    const isBrowser = /^(url|games|users|collections|search|press|featured)/.test(path)
    if (!visible && !isBrowser) {
      return ''
    }

    if (path === 'dashboard') {
      return <Dashboard key={tabId}/>
    } else if (path === 'library') {
      return <Library key={tabId}/>
    } else if (path === 'collections') {
      return <Collections key={tabId}/>
    } else if (path === 'downloads') {
      return <Downloads key={tabId}/>
    } else if (path === 'history') {
      return <History key={tabId}/>
    } else if (path === 'preferences') {
      return <Preferences key={tabId}/>
    } else if (/^locations/.test(path)) {
      const location = pathToId(path)
      return <Location locationName={location} key={tabId}/>
    } else if (/^new/.test(path)) {
      return <NewTab tabId={tabId} key={tabId}/>
    } else if (/^collections\//.test(path)) {
      return <Collection tabId={tabId} tabPath={path} data={data} key={tabId}/>
    } else if (isBrowser) {
      return <UrlMeat tabId={tabId} path={path} key={tabId}/>
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
  tabData: (state) => state.session.navigation.tabData,
  me: (state) => state.session.credentials.me
})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubMeat)
