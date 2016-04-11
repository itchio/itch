
import {createSelector, createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import Loader from './loader'

export class GameMeat extends Component {
  render () {
    const {game} = this.props

    if (!game) {
      return <Loader/>
    }

    return <span>Game {game.title}</span>
  }
}

GameMeat.propTypes = {
  gameId: PropTypes.number,
  game: PropTypes.object
}

const mapStateToProps = (state, props) => {
  const path = `games/${props.gameId}`

  const marketSelector = createStructuredSelector({
    tab: (state) => state.session.navigation.tabData[path],
    user: (state) => state.session.market
  })

  const gameSelector = createSelector(
    marketSelector,
    (markets) => {
      const getGame = (market) => ((market || {}).games || {})[props.gameId]
      const game = getGame(markets.user) || getGame(markets.tab)
      return {
        tabMarket: markets.tab,
        game
      }
    }
  )
  return gameSelector
}

const mapDispatchToProps = (state) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameMeat)
