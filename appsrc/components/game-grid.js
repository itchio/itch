
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import Fuse from 'fuse.js'

import {each, filter, map} from 'underline'

import * as actions from '../actions'

import isPlatformCompatible from '../util/is-platform-compatible'

import Icon from './icon'
import HubItem from './hub-item'
import HubFiller from './hub-filler'

export class GameGrid extends Component {
  constructor () {
    super()
    this.fuse = new Fuse([], {
      keys: [
        { name: 'title', weight: 0.8 },
        { name: 'shortText', weight: 0.4 }
      ],
      threshold: 0.5,
      include: ['score']
    })
  }

  render () {
    const {t, games, filterQuery = '', onlyCompatible, tab, clearFilters} = this.props
    this.fuse.set(games)

    const items = []

    let filteredGames = games
    if (filterQuery.length > 0) {
      const results = this.fuse.search(filterQuery)
      filteredGames = results::map(({item, score}) => ({
        ...item,
        _searchScore: score
      }))
    }
    let hiddenCount = 0

    if (onlyCompatible) {
      filteredGames = filteredGames::filter((game) => isPlatformCompatible(game))
    }

    hiddenCount = games.length - filteredGames.length

    filteredGames::each((game, index) => {
      items.push(<HubItem key={`game-${game.id}`} game={game}/>)
    })

    for (let i = 0; i < 12; i++) {
      items.push(<HubFiller key={`filler-${i}`}/>)
    }

    return <div className='hub-grid'>
    {items}

    {hiddenCount > 0
    ? <div className='hidden-count'>
      {t('grid.hidden_count', {count: hiddenCount})}
      {' '}
      <span className='clear-filters hint--top' data-hint={t('grid.clear_filters')} onClick={() => clearFilters(tab)}>
        <Icon icon='delete'/>
      </span>
    </div>
    : ''}
    </div>
  }
}

GameGrid.propTypes = {
  // specified
  games: PropTypes.any.isRequired,
  predicate: PropTypes.func,

  tab: PropTypes.string.isRequired,

  t: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired
}

const mapStateToProps = (state, props) => {
  const {tab} = props

  return createStructuredSelector({
    filterQuery: (state) => state.session.navigation.filters[tab],
    onlyCompatible: (state) => state.session.navigation.binaryFilters.onlyCompatible
  })
}
const mapDispatchToProps = (dispatch) => ({
  clearFilters: (tab) => {
    dispatch(actions.clearFilters({tab}))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameGrid)
