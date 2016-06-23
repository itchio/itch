
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import GameGrid from './game-grid'
import {map, filter, indexBy, sortBy} from 'underline'

import EnhanceFiltered from './filtered'

const recency = (x) => -(new Date(x.installedAt)) || 0

export class Library extends Component {
  render () {
    const {caves, allGames, downloadKeys, collections, query} = this.props

    const installedGames = caves
      // fetch games
      ::map((c) => ({c, g: allGames[c.gameId] || c.game}))
      // keep only games in *our* userDB
      ::filter((o) => o.g)
      // sort by title, then recency
      ::sortBy((o) => o.g.title)
      ::sortBy((o) => recency(o.c))
      ::map((o) => o.g)
    const installedGamesById = installedGames::indexBy('id')

    const ownedGames = downloadKeys
      ::filter((key) => !installedGamesById[key.gameId])
      ::map((key) => allGames[key.gameId])

    let sectionCount = 0
    if (installedGames.length > 0) {
      sectionCount++
    }
    if (ownedGames.length > 0) {
      sectionCount++
    }
    if (collections.length > 0) {
      sectionCount++
    }

    return <div className='library-meat'>
      {installedGames.length > 0 || ownedGames.length > 0
        ? <GameGrid games={installedGames.concat(ownedGames)} query={query} numLeader={0}/>
        : ''
      }
    </div>
  }
}

Library.propTypes = {
  // derived
  caves: PropTypes.object,
  allGames: PropTypes.object,
  downloadKeys: PropTypes.object,
  collections: PropTypes.object,

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  caves: (state) => state.globalMarket.caves || {},
  allGames: (state) => state.market.games || {},
  downloadKeys: (state) => state.market.downloadKeys || {},
  collections: (state) => state.market.collections || {}
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EnhanceFiltered(Library))
