
import React, {Component, PropTypes} from 'react'
import Fuse from 'fuse.js'

import {each} from 'underline'

import HubItem from './hub-item'
import LeaderHubItem from './leader-hub-item'
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

    let ghostId = 0
    for (let i = 0; i < 12; i++) {
      items.push(<HubGhostItem key={`ghost-${ghostId++}`}/>)
    }

    return <div className='hub-grid'>
      {items}
    </div>
  }
}

GameGrid.propTypes = {
  // specified
  games: PropTypes.any.isRequired,
  numLeader: PropTypes.number,
  predicate: PropTypes.func
}

export default GameGrid
