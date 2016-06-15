
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createSelector, createStructuredSelector} from 'reselect'

import GameGrid from './game-grid'
import {map, filter} from 'underline'
import {pathToId} from '../util/navigation'

import EnhanceFiltered from './filtered'

export class Collection extends Component {
  render () {
    const {allGames, tabGames, collection, query} = this.props

    if (!collection) {
      return <div className='collection-meat'>
        Loading...
      </div>
    }

    const {gameIds} = collection
    const games = gameIds::map((gameId) => tabGames[gameId] || allGames[gameId])::filter((x) => !!x)

    return <div className='collection-meat'>
      <GameGrid games={games} query={query} numLeader={0}/>
    </div>
  }
}

Collection.propTypes = {
  // derived
  data: PropTypes.object,
  allGames: PropTypes.object,
  collection: PropTypes.object,

  t: PropTypes.func.isRequired
}

const mapStateToProps = () => {
  const marketSelector = createStructuredSelector({
    collectionId: (state, props) => +pathToId(props.tabPath),
    userMarket: (state, props) => state.market,
    globalMarket: (state, props) => state.globalMarket,
    tabData: (state, props) => state.session.navigation.tabData[props.tabId] || {}
  })

  return createSelector(
    marketSelector,
    (cs) => {
      const allGames = (cs.userMarket || {}).games || {}
      const tabGames = cs.tabData.games || {}
      const getCollection = (market) => ((market || {}).collections || {})[cs.collectionId] || {}
      const collection = getCollection(cs.tabData) || getCollection(cs.userMarket)
      return {collection, allGames, tabGames}
    }
  )
}

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EnhanceFiltered(Collection))
