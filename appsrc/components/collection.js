
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createSelector, createStructuredSelector} from 'reselect'

import * as actions from '../actions'
import urls from '../constants/urls'

import Icon from './icon'
import GameGrid from './game-grid'
import GameGridFilters from './game-grid-filters'

import {map, filter} from 'underline'
import {pathToId} from '../util/navigation'

export class Collection extends Component {
  render () {
    const {t, allGames, tabGames, collection, initiateShare} = this.props

    if (!collection) {
      return <div className='collection-meat'>
        Loading...
      </div>
    }

    const {gameIds} = collection
    const games = gameIds::map((gameId) => tabGames[gameId] || allGames[gameId])::filter((x) => !!x)

    const tab = `collections/${collection.id}`

    return <div className='collection-meat'>
      <GameGridFilters tab={tab}>
        <span className='link-icon' onClick={(e) => initiateShare(`${urls.itchio}/c/${collection.id}`)}>
          <Icon icon='share'/>
        </span>
      </GameGridFilters>

      {games.length > 0
        ? <GameGrid games={games} tab={tab}/>
        : <p className='empty'>{t('collection.empty')}</p>
      }
    </div>
  }
}

Collection.propTypes = {
  // derived
  data: PropTypes.object,
  allGames: PropTypes.object,
  collection: PropTypes.object,

  t: PropTypes.func.isRequired,
  initiateShare: PropTypes.func.isRequired
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

const mapDispatchToProps = (dispatch) => ({
  initiateShare: (url) => dispatch(actions.initiateShare({url}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Collection)
