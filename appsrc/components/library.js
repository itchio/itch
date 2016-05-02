
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import GameGrid from './game-grid'
import CollectionGrid from './collection-grid'
import {map, filter, indexBy, sortBy} from 'underline'

import EnhanceFiltered from './filtered'

const recency = (x) => -x.lastTouched || 0

export class Library extends Component {
  render () {
    const {t, caves, allGames, downloadKeys, collections, query} = this.props

    const installedGames = caves::sortBy(recency)::map((key) => allGames[key.gameId])::filter((x) => !!x)
    const installedGamesById = installedGames::indexBy('id')

    const games = downloadKeys::map((key) => allGames[key.gameId])::filter((x) => !installedGamesById[x.id])

    let sectionCount = 0
    if (installedGames.length > 0) {
      sectionCount++
    }
    if (games.length > 0) {
      sectionCount++
    }
    if (collections.length > 0) {
      sectionCount++
    }

    const showHeaders = (sectionCount > 1)
    const headerClasses = classNames('', {shown: showHeaders})

    return <div className='library-meat'>
      {installedGames.length > 0 || games.length > 0
        ? <GameGrid games={installedGames.concat(games)} query={query} numLeader={3}/>
        : ''
      }

      <h2 className={headerClasses}>{t('sidebar.collections')}</h2>
      <CollectionGrid collections={collections} query={query}/>
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
