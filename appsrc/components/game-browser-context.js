
import {createSelector, createStructuredSelector} from 'reselect'
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'
import {connect} from './connect'

import getDominantColor from './get-dominant-color'

import GameActions from './game-actions'
import GameStats from './game-stats'
import {pathToId} from '../util/navigation'

import {findWhere} from 'underline'

import GameBrowserContextActions from './game-browser-context-actions'

export class GameBrowserContext extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const barStyle = {}

    const {browserState, game} = this.props
    const {loading} = browserState
    const barClasses = classNames('browser-context', 'game-browser-context', {loading})

    const coverStyle = {}
    if (game.coverUrl) {
      coverStyle.backgroundImage = `url('${game.coverUrl}')`
    }

    return <div className={barClasses} style={barStyle}>
      <div className='cover' style={coverStyle}/>
      <GameStats game={game} mdash={false}/>
      {this.gameActions()}
    </div>
  }

  gameActions () {
    const {game} = this.props
    if (!game) return ''

    return <GameActions game={game} CustomSecondary={GameBrowserContextActions}/>
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
        this.setState({dominantColor: getDominantColor.pick(palette)})
      })
    }
  }
}

GameBrowserContext.propTypes = {
  gameId: PropTypes.number,
  game: PropTypes.object,
  cave: PropTypes.object,
  downloadKey: PropTypes.object,

  t: PropTypes.func.isRequired
}

const mapStateToProps = () => {
  const marketSelector = createStructuredSelector({
    gameId: (state, props) => +pathToId(props.tabPath),
    userMarket: (state, props) => state.market,
    globalMarket: (state, props) => state.globalMarket,
    tabData: (state, props) => props.tabData
  })

  return createSelector(
    marketSelector,
    (cs) => {
      const getGame = (market) => ((market || {}).games || {})[cs.gameId]
      const game = getGame(cs.userMarket) || getGame(cs.tabData)
      const downloadKey = ((cs.userMarket || {}).downloadKeys || {})::findWhere({gameId: cs.gameId})
      const cave = cs.globalMarket.cavesByGameId[cs.gameId]
      return {game, downloadKey, cave}
    }
  )
}

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameBrowserContext)
