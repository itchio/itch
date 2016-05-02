
import React, {Component, PropTypes} from 'react'

import {filter, each} from 'underline'

import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

const passthrough = (t) => true

export class GameGrid extends Component {
  render () {
    const {games, predicate = passthrough} = this.props

    const items = []

    games::filter(predicate)::each((game, id) => {
      items.push(<HubItem key={`game-${id}`} game={game}/>)
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
  predicate: PropTypes.func
}

export default GameGrid
