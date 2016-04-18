
import {createSelector, createStructuredSelector} from 'reselect'
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'

import defaultImages from '../constants/default-images'
import classificationActions from '../constants/classification-actions'

import getDominantColor from './get-dominant-color'

import GameActions from './game-actions'
import BrowserControls from './browser-controls'
import {pathToId} from '../util/navigation'

import TimeAgo from 'react-timeago'
import format, {DATE_FORMAT} from '../util/format'
import dateFormat from 'dateformat'

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

    return <GameActions game={game} showSecondary/>
  }

  aboveControls () {
    const {t, cave, game = {}} = this.props
    const {lastTouched = 0, secondsRun = 0} = (cave || {})

    const classification = game.classification || 'game'
    const classAction = classificationActions[classification] || 'launch'
    const xed = classAction === 'open' ? 'opened' : ((classification === 'game') ? 'played' : 'used')
    const lastTouchedDate = new Date(lastTouched)

    if (cave) {
      return <div className='game-stats'>
        t(``)
          { secondsRun > 0 && classAction === 'launch'
            ? <div className='total-playtime'>
              <span><label>{t(`usage_stats.has_${xed}_for_duration`)}</label> {t.format(format.seconds(secondsRun))}</span>
              </div>
            : '' }
        <div className='last-playthrough'>
        { lastTouched > 0
          ? <span><label>{t(`usage_stats.last_${xed}_on`)}</label> {(
            (Date.now() - lastTouched) > (60 * 1000)
            ? <span className='hint--bottom' data-hint={dateFormat(lastTouchedDate, DATE_FORMAT)}><TimeAgo date={lastTouchedDate} title=''/></span>
            : t('moment.now')
          )}</span>
          : '' }
        </div>
      </div>
    } else {
      return <div className='game-stats'>
          { secondsRun > 0 && classAction === 'launch'
            ? <div className='total-playtime'>
              <span><label>{t(`usage_stats.has_${xed}_for_duration`)}</label> {t.format(format.seconds(secondsRun))}</span>
              </div>
            : '' }
        <div className='last-playthrough'>
        { lastTouched > 0
          ? <span><label>{t(`usage_stats.last_${xed}_on`)}</label> {(
            (Date.now() - lastTouched) > (60 * 1000)
            ? <span className='hint--bottom' data-hint={dateFormat(lastTouchedDate, DATE_FORMAT)}><TimeAgo date={lastTouchedDate} title=''/></span>
            : t('moment.now')
          )}</span>
          : '' }
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
      const cave = cs.globalMarket.cavesByGameId[cs.gameId]
      return {game, cave}
    }
  )
  return gameSelector
}

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameBrowserBar)
