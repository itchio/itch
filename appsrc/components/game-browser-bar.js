
import {createSelector, createStructuredSelector} from 'reselect'
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'

import defaultImages from '../constants/default-images'

import getDominantColor from './get-dominant-color'

import GameActions from './game-actions'
import BrowserControls from './browser-controls'
import {pathToId} from '../util/navigation'

export class GameBrowserBar extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const barStyle = {}
    const {dominantColor} = this.state
    if (dominantColor) {
      barStyle.borderTop = `2px solid ${dominantColor}`
    }

    return <div className='browser-bar game-browser-bar' style={barStyle}>
      {this.beforeControls()}
      <div className='controls'>
        {this.aboveControls()}
        <BrowserControls {...this.props}/>
      </div>
      {this.afterControls()}
    </div>
  }

  beforeControls () {
    const {game} = this.props
    if (!game) return ''

    const coverUrl = game.coverUrl || defaultImages.thumbnail
    const coverStyle = {
      backgroundImage: `url('${coverUrl}')`
    }
    return <div className='game-cover' style={coverStyle}/>
  }

  afterControls () {
    const {game} = this.props
    if (!game) return ''

    const {dominantColor} = this.state
    return <GameActions game={game} showSecondary dominantColor={dominantColor}/>
  }

  aboveControls () {
    return <div className='game-stats'>
      <div className='total-playtime'>Played 48 hours</div>
      <div className='last-playthrough'>Last played now</div>
    </div>
  }

  componentWillReceiveProps () {
    this.updateColor()
  }

  componentDidMount () {
    this.updateColor()
  }

  updateColor () {
    const {game} = this.props
    if (game) {
      getDominantColor(game.coverUrl, (palette) => {
        this.setState({dominantColor: getDominantColor.toCSS(getDominantColor.pick(palette))})
      })
    }
  }
}

GameBrowserBar.propTypes = {
  gameId: PropTypes.number,
  game: PropTypes.object
}

const mapStateToProps = (state, props) => {
  const marketSelector = createStructuredSelector({
    gameId: (state, props) => +pathToId(props.tabPath),
    userMarket: (state, props) => state.session.market,
    tabData: (state, props) => props.tabData
  })

  const gameSelector = createSelector(
    marketSelector,
    (cs) => {
      const getGame = (market) => ((market || {}).games || {})[cs.gameId]
      const game = getGame(cs.userMarket) || getGame(cs.tabData)
      return {game}
    }
  )
  return gameSelector
}

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameBrowserBar)
