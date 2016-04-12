
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {pathToId} from '../util/navigation'
import {createSelector, createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import HubSearchResults from './hub-search-results'
import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

import Downloads from './downloads'
import History from './history'
import FeaturedMeat from './featured-meat'
import CollectionMeat from './collection-meat'
import GameMeat from './game-meat'
import SearchMeat from './search-meat'
import UrlMeat from './url-meat'

import {pluck, filter, each, map, indexBy, where} from 'underline'

export class HubMeat extends Component {
  render () {
    const {tabs} = this.props

    return <div className='hub-meat'>
      {tabs::map((path) => {
        const visible = (path === this.props.path)
        const classes = classNames('hub-meat-tab', {visible})
        return <div key={path} className={classes}>{this.renderTab(path)}</div>
      })}
      <HubSearchResults/>
    </div>
  }

  renderTab (path) {
    const {me, games, downloadKeys} = this.props

    if (path === 'featured') {
      return <FeaturedMeat/>
    } else if (path === 'dashboard') {
      return this.gameGrid(games::where({userId: me.id}))
    } else if (path === 'library') {
      return this.gameGrid(downloadKeys::map((key) => games[key.gameId])::indexBy('id'))
    } else if (path === 'downloads') {
      return <Downloads/>
    } else if (path === 'history') {
      return <History/>
    } else if (/^collections/.test(path)) {
      return <CollectionMeat collectionId={+pathToId(path)}/>
    } else if (/^games/.test(path)) {
      return <GameMeat path={path} gameId={+pathToId(path)}/>
    } else if (/^search/.test(path)) {
      return <SearchMeat query={pathToId(path)}/>
    } else if (/^url/.test(path)) {
      return <UrlMeat path={path} url={pathToId(path)}/>
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
  downloadKeys: PropTypes.object,
  tabs: PropTypes.array
}

const allTabsSelector = createSelector(
  (state) => state.session.navigation.tabs,
  (tabs) => tabs.constant::pluck('path').concat(tabs.transient::pluck('path'))
)

const mapStateToProps = createStructuredSelector({
  typedQuery: (state) => state.session.search.typedQuery,
  path: (state) => state.session.navigation.path,
  tabs: (state) => allTabsSelector(state),
  me: (state) => state.session.credentials.me,
  games: (state) => state.market.games,
  collections: (state) => state.market.collections,
  downloadKeys: (state) => state.market.downloadKeys
})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubMeat)
