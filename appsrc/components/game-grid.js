
import React, {Component, PropTypes} from 'react'
import Fuse from 'fuse.js'

import {each} from 'underline'

import HubItem from './hub-item'
import LeaderHubItem from './leader-hub-item'

import InfiniteGrid from 'react-infinite-grid'

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
    const {games, query = ''} = this.props
    let {numLeader = 0} = this.props
    if (query.length > 0) {
      numLeader = Infinity
    }

    const items = []

    const filteredGames = query.length === 0 ? games : this.fuse.search(query)

    filteredGames::each((game, index) => {
      if (index < numLeader) {
        items.push(<LeaderHubItem key={`game-${game.id}`} game={game}/>)
      } else {
        items.push(<HubItem key={`game-${game.id}`} game={game}/>)
      }
    })

    return <InfiniteGrid className='hub-grid' itemClassName={'hub-item'} entries={items} width={235} height={300} padding={10}/>
  }
}

GameGrid.propTypes = {
  // specified
  games: PropTypes.any.isRequired,
  numLeader: PropTypes.number,
  predicate: PropTypes.func
}

export default GameGrid
