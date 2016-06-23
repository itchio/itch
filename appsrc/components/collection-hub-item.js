
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import invariant from 'invariant'

import {connect} from './connect'

import {map, filter} from 'underline'

import * as actions from '../actions'

export class CollectionHubItem extends Component {
  render () {
    const {allGames, collection} = this.props
    const {navigateToCollection} = this.props
    const {title} = collection

    const gameIds = (collection.gameIds || []).slice(0, 4)
    const games = gameIds::map((gameId) => allGames[gameId])::filter((x) => !!x)

    return <div className='hub-item collection-hub-item' onClick={() => navigateToCollection(collection)}>
      <section className='title'>
        {title} ({(collection.gameIds || []).length})
      </section>
      <section className='fresco'>
        {games::map((game) => {
          const style = {}
          const coverUrl = game.stillCoverUrl || game.coverUrl
          if (coverUrl) {
            style.backgroundImage = `url('${coverUrl}')`
          }
          return <div className='cover' style={style}></div>
        })}
      </section>
    </div>
  }
}

CollectionHubItem.propTypes = {
  // derived
  allGames: PropTypes.object,

  navigateToCollection: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  allGames: (state) => (state.market || {}).games || {}
})

const mapDispatchToProps = (dispatch) => ({
  navigateToCollection: (collection) => {
    invariant(typeof collection === 'object', 'collection is an object')
    dispatch(actions.navigateToCollection(collection))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CollectionHubItem)
