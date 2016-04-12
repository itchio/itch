
import {createSelector, createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import defaultImages from '../constants/default-images'

import Loader from './loader'
import GameActions from './game-actions'
import BrowserMeat from './browser-meat'

export class GameMeat extends Component {
  render () {
    const {game, path} = this.props

    if (!game) {
      return <Loader/>
    }

    const coverUrl = game.coverUrl || defaultImages.thumbnail
    const coverStyle = {
      backgroundImage: `url('${coverUrl}')`
    }

    const beforeControls = <div className='game-cover' style={coverStyle}/>

    const aboveControls = <div className='game-stats'>
      <div className='total-playtime'>Played 48 hours</div>
      <div className='last-playthrough'>Last played now</div>
    </div>

    const afterControls = <GameActions game={game} showSecondary/>

    const browserProps = {beforeControls, aboveControls, afterControls}

    return <BrowserMeat className='game-meat' path={path} url={game.url} {...browserProps}/>
  }
}

GameMeat.propTypes = {
  path: PropTypes.string.isRequired,
  gameId: PropTypes.number,
  game: PropTypes.object
}

const mapStateToProps = (state, props) => {
  const marketSelector = createStructuredSelector({
    gameId: (state, props) => props.gameId,
    tab: (state, props) => {
      const path = `games/${props.gameId}`
      return state.session.navigation.tabData[path]
    },
    user: (state) => state.session.market
  })

  const gameSelector = createSelector(
    marketSelector,
    (componentState) => {
      const {gameId} = componentState

      const getGame = (market) => ((market || {}).games || {})[gameId]
      const game = getGame(componentState.user) || getGame(componentState.tab)
      return {game}
    }
  )
  return gameSelector
}

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameMeat)
