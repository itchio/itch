
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {filter, each} from 'underline'

import HubItem from './hub-item'
import HubGhostItem from './hub-ghost-item'

import {searchQueryChanged} from '../actions'

export class GameGrid extends Component {
  render () {
    const {t, games, typedQuery = ''} = this.props
    const {clearSearchFilter} = this.props

    const items = []

    let predicate = (x) => true

    // you speak latin? good for you!
    const criterions = []

    if (typedQuery && typedQuery.length > 0) {
      criterions.push(<div className='criterion filter-info'>
        <span className='label'>{t('grid.criterion.filtered_by', {term: typedQuery})}</span>
        <span className='remove-filter icon icon-cross' onClick={clearSearchFilter}/>
      </div>)

      const token = typedQuery.toLowerCase()
      predicate = (x) => x.title.toLowerCase().indexOf(token) !== -1
    }

    if (criterions.length > 0) {
      items.push(<div className='criterion-bar'>
        {criterions}
      </div>)
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
  typedQuery: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  typedQuery: (state) => state.session.search.typedQuery
})

const mapDispatchToProps = (dispatch) => ({
  clearSearchFilter: () => dispatch(searchQueryChanged(''))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameGrid)
