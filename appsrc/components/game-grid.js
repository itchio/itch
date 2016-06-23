
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import Fuse from 'fuse.js'

import {each, filter, map} from 'underline'

import isPlatformCompatible from '../util/is-platform-compatible'

import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

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
    const {t, games, filterQuery = '', onlyCompatible} = this.props
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

    for (var i = 0; i < 12; i++) {
      items.push(<HubGhostItem key={`ghost-${i}`}/>)
    }

    return <div className='hub-grid'>
    {items}
    {hiddenCount > 0
    ? <div className='hidden-count'>
      {t('grid.hidden_count', {count: hiddenCount})}
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

  t: PropTypes.func.isRequired
}

const mapStateToProps = (state, props) => {
  const {tab} = props

  return createStructuredSelector({
    filterQuery: (state) => state.session.navigation.filters[tab],
    onlyCompatible: (state) => state.session.navigation.binaryFilters.onlyCompatible
  })
}
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameGrid)
