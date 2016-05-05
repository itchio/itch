
import {createSelector, createStructuredSelector} from 'reselect'
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'
import {connect} from './connect'

import getDominantColor from './get-dominant-color'

import GameActions from './game-actions'
import GameStats from './game-stats'
import BrowserControls from './browser-controls'
import {pathToId} from '../util/navigation'
import Dropdown from './dropdown'

import {findWhere} from 'underline'

import Icon from './icon'

import listSecondaryActions from './game-actions/list-secondary-actions'

class GameDropdown extends Component {
  render () {
    const {items} = listSecondaryActions(this.props)
    const inner = <Icon icon='triangle-down' classes={['secondary-dropdown']}/>

    return <Dropdown items={items} inner={inner}/>
  }
}

export class GameBrowserBar extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const barStyle = {}
    const {dominantColor} = this.state
    if (dominantColor) {
      const rgba = getDominantColor.toCSSAlpha(dominantColor, 0.8)
      barStyle.borderImageSource = `repeating-linear-gradient(to right, ${rgba} 0, ${rgba} 95%, transparent 95%, transparent 100%)`
      barStyle.borderWidth = '0px'
      barStyle.borderTopWidth = '2px'
    }

    const {browserState, game} = this.props
    const {loading} = browserState
    const barClasses = classNames('browser-bar', 'game-browser-bar', {loading})

    return <div className={barClasses} style={barStyle}>
      <div className='controls'>
        <BrowserControls {...this.props}/>
      </div>
      <GameStats game={game}/>
      {this.gameActions()}
    </div>
  }

  gameActions () {
    const {game} = this.props
    if (!game) return ''

    return <GameActions game={game} CustomSecondary={GameDropdown}/>
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

GameBrowserBar.propTypes = {
  gameId: PropTypes.number,
  game: PropTypes.object,
  cave: PropTypes.object,
  downloadKey: PropTypes.object,

  t: PropTypes.func.isRequired
}

const mapStateToProps = () => {
  const marketSelector = createStructuredSelector({
    gameId: (state, props) => +pathToId(props.tabPath),
    userMarket: (state, props) => state.session.market,
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
)(GameBrowserBar)
