
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {pathToId} from '../util/navigation'
import {createStructuredSelector} from 'reselect'

import HubSearchResults from './hub-search-results'
import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

import Downloads from './downloads'
import History from './history'
import FeaturedMeat from './featured-meat'
import CollectionMeat from './collection-meat'
import GameMeat from './game-meat'
import SearchMeat from './search-meat'

import {filter, each, map, indexBy, where} from 'underline'

export class HubMeat extends Component {
  render () {
    const {path, me, games, downloadKeys} = this.props

    let child = ''

    if (path === 'featured') {
      child = <FeaturedMeat/>
    } else if (path === 'dashboard') {
      child = this.gameGrid(games::where({userId: me.id}))
    } else if (path === 'library') {
      child = this.gameGrid(downloadKeys::map((key) => games[key.gameId])::indexBy('id'))
    } else if (path === 'downloads') {
      child = <Downloads/>
    } else if (path === 'history') {
      child = <History/>
    } else if (/^collections/.test(path)) {
      child = <CollectionMeat collectionId={+pathToId(path)}/>
    } else if (/^games/.test(path)) {
      child = <GameMeat gameId={+pathToId(path)}/>
    } else if (/^search/.test(path)) {
      child = <SearchMeat query={pathToId(path)}/>
    }

    return <div className='hub-meat'>
      {child}
      <HubSearchResults/>
    </div>
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
  downloadKeys: PropTypes.object
}

const mapStateToProps = createStructuredSelector({
  typedQuery: (state) => state.session.search.typedQuery,
  path: (state) => state.session.navigation.path,
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
