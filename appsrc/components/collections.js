
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import Fuse from 'fuse.js'

import {map, sortBy} from 'underline'

import GameGridFilters from './game-grid-filters'
import CollectionHubItem from './collection-hub-item'

const recency = (x) => -x.updatedAt || 0

export class Collections extends Component {
  constructor () {
    super()
    this.fuse = new Fuse([], {
      keys: [
        { name: 'title', weight: 1.0 }
      ],
      threshold: 0.4
    })
  }

  render () {
    const {t, filterQuery = '', collections} = this.props

    const recentCollections = collections::sortBy(recency)
    const tab = 'collections'

    this.fuse.set(recentCollections)
    const filteredCollections = filterQuery.length > 0 ? this.fuse.search(filterQuery) : recentCollections

    const hiddenCount = filteredCollections.length - recentCollections.length

    return <div className='collections-meat'>
      <GameGridFilters tab={tab} showBinaryFilters={false}/>
      <div className='hub-grid'>
        {filteredCollections::map((collection) =>
          <CollectionHubItem collection={collection}/>
        )}
        {hiddenCount > 0
        ? <div className='hidden-count'>
          {t('grid.hidden_count', {count: hiddenCount})}
        </div>
    : ''}
      </div>
    </div>
  }
}

Collections.propTypes = {
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
  filterQuery: (state) => state.session.navigation.filters.collections
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Collections)
