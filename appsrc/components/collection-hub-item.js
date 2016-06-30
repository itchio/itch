
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import invariant from 'invariant'

import {connect} from './connect'

import {map, each, filter} from 'underline'

import doesEventMeanBackground from './does-event-mean-background'

import * as actions from '../actions'

export class CollectionHubItem extends Component {
  render () {
    const {allGames, collection} = this.props
    const {navigateToCollection} = this.props
    const {title} = collection

    const gameIds = (collection.gameIds || []).slice(0, 4)
    const games = gameIds::map((gameId) => allGames[gameId])::filter((x) => !!x)
    const gameItems = games::map((game) => {
      const style = {}
      const coverUrl = game.stillCoverUrl || game.coverUrl
      if (coverUrl) {
        style.backgroundImage = `url('${coverUrl}')`
      }
      return <div className='cover' style={style}></div>
    })
    const rows = []
    let cols = []
    gameItems::each((item, i) => {
      cols.push(item)

      if (i % 2 === 1) {
        const row = <div className='row'>{cols}</div>
        rows.push(row)
        cols = []
      }
    })

    return <div className='hub-item collection-hub-item' onClick={(e) => navigateToCollection(collection, doesEventMeanBackground(e))}>
      <section className='title'>
        {title} ({(collection.gameIds || []).length})
      </section>
      <section className='fresco'>
        {rows}
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
  navigateToCollection: (collection, background) => {
    invariant(typeof collection === 'object', 'collection is an object')
    dispatch(actions.navigateToCollection(collection, background))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CollectionHubItem)
