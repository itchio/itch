
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {map, sortBy} from 'underline'

import EnhanceFiltered from './filtered'
import CollectionHubItem from './collection-hub-item'

const recency = (x) => -x.updatedAt || 0

export class Collections extends Component {
  render () {
    // TODO: filtering
    const {collections} = this.props

    const recentCollections = collections::sortBy(recency)

    return <div className='collections-meat'>
      {recentCollections::map((collection) =>
        <CollectionHubItem collection={collection}/>
      )}
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
  collections: (state) => state.market.collections || {}
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EnhanceFiltered(Collections))
