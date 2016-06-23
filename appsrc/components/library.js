
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import classNames from 'classnames'

import GameGrid from './game-grid'
import {map, filter, indexBy, sortBy} from 'underline'

import * as actions from '../actions'

const recency = (x) => -(new Date(x.installedAt)) || 0

export class Library extends Component {
  render () {
    const {t, caves, allGames, downloadKeys, collections, filterQuery, onlyCompatible} = this.props

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
      <section className='filters'>
        <section className='search'>
          <input ref='search' type='search' defaultValue={filterQuery} placeholder='Filter...' onKeyPress={::this.onQueryChanged} onKeyUp={::this.onQueryChanged} onChange={::this.onQueryChanged}/>
          <span className={classNames('icon', 'icon-filter', {active: filterQuery})}/>
        </section>
        <section className='checkboxes'>
          <label>
            <input type='checkbox' checked={onlyCompatible} onChange={(e) => this.onCheckboxChanged('onlyCompatible', e.target.checked)}/>
            {t('grid.criterion.only_compatible')}
          </label>
        </section>
      </section>
      {installedGames.length > 0 || ownedGames.length > 0
        ? <GameGrid games={installedGames.concat(ownedGames)} query={filterQuery} onlyCompatible={onlyCompatible}/>
        : ''
      }
    </div>
  }

  onQueryChanged (e) {
    const {search} = this.refs
    if (!search) return

    this.props.filterChanged(search.value)
  }

  onCheckboxChanged (field, value) {
    this.props.binaryFilterChanged(field, value)
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
  collections: (state) => state.market.collections || {},
  filterQuery: (state) => state.session.navigation.filters.library,
  onlyCompatible: (state) => state.session.navigation.binaryFilters.onlyCompatible
})

const mapDispatchToProps = (dispatch) => ({
  filterChanged: (query) => dispatch(actions.filterChanged({tab: 'library', query})),
  binaryFilterChanged: (field, value) => dispatch(actions.binaryFilterChanged({field, value}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Library)
