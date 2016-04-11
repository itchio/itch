
import {createSelector, createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import defaultImages from '../constants/default-images'

import Loader from './loader'
import GameActions from './game-actions'

export class GameMeat extends Component {
  render () {
    const {game} = this.props

    if (!game) {
      return <Loader/>
    }

    const coverUrl = game.coverUrl || defaultImages.thumbnail
    const coverStyle = {
      backgroundImage: `url('${coverUrl}')`
    }

    return <div className='game-meat'>
      <div className='game-essentials'>
        <div className='game-cover' style={coverStyle}/>
        <div className='game-stats'>
          <div className='total-playtime'>Played 48 hours</div>
          <div className='last-playthrough'>Last played now</div>
        </div>
        <GameActions game={game}/>
      </div>
      <webview src={game.url}>
      </webview>
    </div>
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
