
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import GameGrid from './game-grid'
import {map} from 'underline'

export class Library extends Component {
  render () {
    const {allGames, downloadKeys} = this.props

    const games = downloadKeys::map((key) => allGames[key.gameId])
    return <GameGrid games={games}/>
  }
}

Library.propTypes = {
  // derived
  allGames: PropTypes.object,
  downloadKeys: PropTypes.object,
  collections: PropTypes.object
}

const mapStateToProps = createStructuredSelector({
  allGames: (state) => state.market.games,
  downloadKeys: (state) => state.market.downloadKeys,
  collections: (state) => state.market.collections
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Library)
