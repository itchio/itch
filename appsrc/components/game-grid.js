
import React, {Component, PropTypes} from 'react'
import Fuse from 'fuse.js'

import {each, map} from 'underline'

import HubItem from './hub-item'
import LeaderHubItem from './leader-hub-item'

// import HubGhostItem from './hub-ghost-item'

import {Responsive, WidthProvider} from 'react-grid-layout'
const ResponsiveReactGridLayout = WidthProvider(Responsive)

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
    this.state = {numCols: 4}
  }

  onBreakpointChange (newBreakpoint, newCols) {
    this.setState({numCols: newCols})
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
    //
    // let ghostId = 0
    // for (let i = 0; i < 12; i++) {
    //   items.push(<HubGhostItem key={`ghost-${ghostId++}`}/>)
    // }

    const {numCols} = this.state

    return <ResponsiveReactGridLayout className='hub-grid' items={items.length}
      breakpoints={{llg: 1400, lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
      cols={{llg: 6, lg: 5, md: 4, sm: 3, xs: 2, xxs: 1}} rowHeight={270} onLayoutChange={::this.onLayoutChange}>
      {items::map((item, i) => {
        const grid = {
          x: (i % numCols),
          y: (i - (i % numCols)) / numCols,
          w: 1,
          h: 1
          // static: true
        }
        return <div key={i} _grid={grid}>{item}</div>
      })}
    </ResponsiveReactGridLayout>
  }

  onLayoutChange (layout) {
    console.log('layout changed: ', layout)
  }
}

GameGrid.propTypes = {
  // specified
  games: PropTypes.any.isRequired,
  numLeader: PropTypes.number,
  predicate: PropTypes.func
}

export default GameGrid
