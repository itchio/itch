
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {pathToId} from '../util/navigation'
import {createSelector, createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import HubSearchResults from './hub-search-results'
import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

import Downloads from './downloads'
import Preferences from './preferences'
import History from './history'
import FeaturedMeat from './featured-meat'
import CollectionMeat from './collection-meat'
import SearchMeat from './search-meat'
import UrlMeat from './url-meat'

import {filter, each, map, indexBy} from 'underline'

export class HubMeat extends Component {
  render () {
    const {tabs} = this.props

    return <div className='hub-meat'>
      {tabs::map((tab, i) => {
        const {id, path} = tab
        const visible = (path === this.props.path)
        const classes = classNames('hub-meat-tab', {visible})
        return <div key={id || path} className={classes}>{this.renderTab(id, path)}</div>
      })}
      <HubSearchResults/>
    </div>
  }

  renderTab (tabId, path) {
    const {games, myGameIds, downloadKeys} = this.props

    if (path === 'featured') {
      return <FeaturedMeat/>
    } else if (path === 'dashboard') {
      return this.gameGrid(myGameIds::map((id) => games[id]))
    } else if (path === 'library') {
      return this.gameGrid(downloadKeys::map((key) => games[key.gameId])::indexBy('id'))
    } else if (path === 'downloads') {
      return <Downloads/>
    } else if (path === 'history') {
      return <History/>
    } else if (path === 'preferences') {
      return <Preferences/>
    } else if (/^collections/.test(path)) {
      return <CollectionMeat collectionId={+pathToId(path)}/>
    } else if (/^search/.test(path)) {
      return <SearchMeat query={pathToId(path)}/>
    } else if (/^(url|games|users)/.test(path)) {
      return <UrlMeat key={tabId} tabId={tabId} path={path}/>
    } else {
      return '?'
    }
  }

  gameGrid (games) {
    const items = []
    const {typedQuery} = this.props

    let predicate = (x) => true

    if (typedQuery && typedQuery.length > 0) {
      items.push(<h2 className='filter-info'>Filtering by {typedQuery}</h2>)

      const token = typedQuery.toLowerCase()
      predicate = (x) => x.title.toLowerCase().indexOf(token) !== -1
    }

    games::filter(predicate)::each((game, id) => {
      items.push(<HubItem key={`game-${id}`} game={game}/>)
    })

    let ghostId = 0
    for (let i = 0; i < 12; i++) {
      items.push(<HubGhostItem key={`ghost-${ghostId++}`}/>)
    }

    return <div className='hub-grid'>
      {items}
    </div>
  }
}

HubMeat.propTypes = {
  typedQuery: PropTypes.string,
  path: PropTypes.string,
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
  typedQuery: (state) => state.session.search.typedQuery,
  path: (state) => state.session.navigation.path,
  tabs: (state) => allTabsSelector(state),
  me: (state) => state.session.credentials.me,
  games: (state) => state.market.games,
  myGameIds: (state) => (((state.market.itchAppProfile || {}).myGames || {}).ids || []),
  collections: (state) => state.market.collections,
  downloadKeys: (state) => state.market.downloadKeys
})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubMeat)
