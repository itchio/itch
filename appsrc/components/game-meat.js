
import {createSelector, createStructuredSelector} from 'reselect'
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'
import classNames from 'classnames'

import defaultImages from '../constants/default-images'

import Loader from './loader'
import GameActions from './game-actions'

export class GameMeat extends Component {
  constructor () {
    super()
    this.state = {
      browserState: {
        canGoBack: false,
        canGoForward: false,
        loading: true,
        url: ''
      }
    }
  }

  updateBrowserState (props = {}) {
    const {webview} = this.refs
    if (!webview) {
      console.log(`Can't update browser state (no webview ref)`)
      return
    }
    const browserState = {
      ...this.state.browserState,
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward(),
      ...props
    }

    this.setState({
      ...this.state,
      browserState
    })
  }

  componentDidMount () {
    const {webview} = this.refs
    if (!webview) {
      console.log(`Oh noes, can't listen to webview's soothing event stream`)
      return
    }
    webview.addEventListener('load-commit', () => this.updateBrowserState({url: webview.getURL()}))
    webview.addEventListener('did-start-loading', () => this.updateBrowserState({loading: true}))
    webview.addEventListener('did-stop-loading', () => this.updateBrowserState({loading: false}))
  }

  render () {
    const {game, meId} = this.props

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
        <div className='controls'>
          <div className='game-stats'>
            <div className='total-playtime'>Played 48 hours</div>
            <div className='last-playthrough'>Last played now</div>
          </div>
          {this.browserControls()}
        </div>
        <GameActions game={game} showSecondary/>
      </div>
      <webview ref='webview' src={game.url} partition={`persist:itchio-${meId}`} plugins/>
    </div>
  }

  browserControls () {
    const {browserState} = this.state
    const {canGoBack, canGoForward, loading, url = ''} = browserState

    return <div className='browser-controls'>
      <span className={classNames('icon icon-arrow-left', {disabled: !canGoBack})} onClick={() => this.goBack()}/>
      <span className={classNames('icon icon-arrow-right', {disabled: !canGoForward})} onClick={() => this.goForward()}/>
      {
        loading
        ? <span className='icon icon-cross loading' onClick={() => this.stop()}/>
        : <span className='icon icon-repeat' onClick={() => this.reload()}/>
      }
      <span className='browser-address'>{url + ' '}</span>
    </div>
  }

  stop () {
    const {webview} = this.refs
    if (!webview) return
    webview.reload()
  }

  reload () {
    const {webview} = this.refs
    if (!webview) return
    webview.reload()
  }

  goBack () {
    const {webview} = this.refs
    if (!webview) return
    webview.goBack()
  }

  goForward () {
    const {webview} = this.refs
    if (!webview) return
    webview.goForward()
  }
}

GameMeat.propTypes = {
  gameId: PropTypes.number,
  game: PropTypes.object,
  meId: PropTypes.any
}

const mapStateToProps = (state, props) => {
  const marketSelector = createStructuredSelector({
    gameId: (state, props) => props.gameId,
    tab: (state, props) => {
      const path = `games/${props.gameId}`
      return state.session.navigation.tabData[path]
    },
    user: (state) => state.session.market,
    meId: (state) => state.session.credentials.me.id
  })

  const gameSelector = createSelector(
    marketSelector,
    (componentState) => {
      const {gameId, meId} = componentState

      const getGame = (market) => ((market || {}).games || {})[gameId]
      const game = getGame(componentState.user) || getGame(componentState.tab)
      return { game, meId }
    }
  )
  return gameSelector
}

const mapDispatchToProps = (state) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameMeat)
