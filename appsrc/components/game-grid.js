
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {filter, each} from 'underline'

import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

export class GameGrid extends Component {
  render () {
    const {games, typedQuery = ''} = this.props
    const items = []
    console.log('games = ', games, ' typedQuery = ', typedQuery)

    let predicate = (x) => true

    if (typedQuery && typedQuery.length > 0) {
      items.push(<h2 className='filter-info'>Filtering by {typedQuery}</h2>)

      const token = typedQuery.toLowerCase()
      predicate = (x) => x.title.toLowerCase().indexOf(token) !== -1
    }

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

  // derived
  typedQuery: PropTypes.string.isRequired
}

const mapStateToProps = createStructuredSelector({
  typedQuery: (state) => state.session.search.typedQuery
})
const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameGrid)
