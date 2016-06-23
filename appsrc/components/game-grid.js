
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import Fuse from 'fuse.js'

import {each, filter} from 'underline'

import isPlatformCompatible from '../util/is-platform-compatible'

import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

export class GameGrid extends Component {
  constructor () {
    super()
    this.fuse = new Fuse([], {
      keys: [
        {
          name: 'title',
          weight: 0.8
        },
        {
          name: 'shortText',
          weight: 0.4
        }
      ]
    })
  }

  componentWillReceiveProps (nextProps) {
    const {games} = nextProps
    if (games) {
      this.fuse.set(games)
    }
  }

  render () {
    const {t, games, query = '', onlyCompatible} = this.props

    const items = []

    let filteredGames = query.length === 0 ? games : this.fuse.search(query)
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
  numLeader: PropTypes.number,
  predicate: PropTypes.func,

  t: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({})
const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameGrid)
