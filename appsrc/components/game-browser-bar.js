
import {createSelector, createStructuredSelector} from 'reselect'
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'

import platformData from '../constants/platform-data'
import classificationActions from '../constants/classification-actions'

import getDominantColor from './get-dominant-color'

import GameActions from './game-actions'
import interleave from './interleave'
import BrowserControls from './browser-controls'
import {pathToId} from '../util/navigation'
import Dropdown from './dropdown'

import {findWhere} from 'underline'

import NiceAgo from './nice-ago'
import Icon from './icon'
import format from '../util/format'

import listSecondaryActions from './game-actions/list-secondary-actions'

class GameDropdown extends Component {
  render () {
    const {items} = listSecondaryActions(this.props)
    const inner = <Icon icon='triangle-down' classes='secondary-dropdown'/>

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
      barStyle.borderTop = `2px solid ${rgba}`
    }

    return <div className='browser-bar game-browser-bar' style={barStyle}>
      <div className='controls'>
        <BrowserControls {...this.props}/>
      </div>
      {this.gameStats()}
      {this.gameActions()}
    </div>
  }

  gameActions () {
    const {game} = this.props
    if (!game) return ''

    return <GameActions game={game} CustomSecondary={GameDropdown}/>
  }

  gameStats () {
    const {t, cave, game = {}, downloadKey} = this.props
    const {lastTouched = 0, secondsRun = 0} = (cave || {})

    const classification = game.classification || 'game'
    const classAction = classificationActions[classification] || 'launch'
    const xed = classAction === 'open' ? 'opened' : ((classification === 'game') ? 'played' : 'used')
    const lastTouchedDate = new Date(lastTouched)

    if (cave) {
      return <div className='game-stats'>
        { secondsRun > 0 && classAction === 'launch'
          ? <div className='total-playtime'>
            <span><label>{t(`usage_stats.has_${xed}_for_duration`)}</label> {t.format(format.seconds(secondsRun))}</span>
            </div>
          : '' }
        <div className='last-playthrough'>
        { lastTouched > 0
          ? <label>
            {interleave(t, `usage_stats.last_${xed}_time_ago`, {time_ago: <NiceAgo date={lastTouchedDate}/>})}
          </label>
          : t(`usage_stats.never_${xed}`) }
        </div>
      </div>
    } else {
      const platforms = []
      if (classAction === 'launch') {
        for (const p of platformData) {
          if (game[p.field]) {
            platforms.push(<Icon title={p.platform} icon={p.icon}/>)
          }
        }
      }
      const {minPrice, currency = 'USD'} = game

      return <div className='game-stats'>
        <div className='total-playtime'>
        {t(`usage_stats.description.${classification}`)}
        { (platforms.length > 0)
          ? [' ', interleave(t, `usage_stats.description.platforms`, {platforms})]
          : '' }
        {' — '}
        { (downloadKey)
          ? interleave(t, `usage_stats.description.bought_time_ago`, {time_ago: <NiceAgo date={downloadKey.createdAt}/>})
          : (minPrice > 0
            ? interleave(t, 'usage_stats.description.price', {
              price: <label>
                {format.price(currency, minPrice)}
              </label>
            })
            : t('usage_stats.description.free_download')
          ) }
        </div>
      </div>
    }
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

const mapStateToProps = (state, props) => {
  const marketSelector = createStructuredSelector({
    gameId: (state, props) => +pathToId(props.tabPath),
    userMarket: (state, props) => state.session.market,
    globalMarket: (state, props) => state.globalMarket,
    tabData: (state, props) => props.tabData
  })

  const gameSelector = createSelector(
    marketSelector,
    (cs) => {
      const getGame = (market) => ((market || {}).games || {})[cs.gameId]
      const game = getGame(cs.userMarket) || getGame(cs.tabData)
      const downloadKey = ((cs.userMarket || {}).downloadKeys || {})::findWhere({gameId: cs.gameId})
      const cave = cs.globalMarket.cavesByGameId[cs.gameId]
      return {game, downloadKey, cave}
    }
  )
  return gameSelector
}

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameBrowserBar)
