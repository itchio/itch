
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {each} from 'underline'

import * as actions from '../actions'

import platformData from '../constants/platform-data'
import defaultImages from '../constants/default-images'
import format from '../util/format'

import Icon from './icon'

import os from '../util/os'
const itchPlatform = os.itchPlatform()

export class SearchResult extends Component {
  render () {
    const {game, onClick} = this.props
    const {title, stillCoverUrl, coverUrl} = game

    const platforms = []
    let compatible = false
    if (game.type === 'html') {
      compatible = true
      platforms.push(<Icon title='web' icon='earth'/>)
    }

    for (const p of platformData) {
      if (game[p.field]) {
        if (p.platform === itchPlatform) {
          compatible = true
        }
        platforms.push(<Icon title={p.platform} icon={p.icon}/>)
      }
    }

    let price = ''
    if (game.minPrice > 0) {
      price = <span className='price'>{format.price('USD', game.minPrice)}</span>
    }

    const resultClasses = classNames('search-result', {
      ['not-platform-compatible']: !compatible
    })

    return <div className={resultClasses} onClick={onClick}>
      <img src={stillCoverUrl || coverUrl || 'about:blank'}/>
      <div className='title-block'>
        <h4>{title}</h4>
        <span className='platforms'>
          {platforms}
          {price}
        </span>
      </div>
    </div>
  }
}

SearchResult.propTypes = {
  game: PropTypes.shape({
    title: PropTypes.string,
    coverUrl: PropTypes.string
  }),
  onClick: PropTypes.func
}

export class UserSearchResult extends Component {
  render () {
    const {user, onClick} = this.props
    const {displayName, username, stillCoverUrl, coverUrl} = user

    const resultClasses = classNames('search-result', 'user-search-result')

    return <div className={resultClasses} onClick={onClick}>
      <img src={stillCoverUrl || coverUrl || defaultImages.avatar}/>
      <div className='title-block'>
        <h4>{displayName || username}</h4>
      </div>
    </div>
  }
}

export class HubSearchResults extends Component {
  render () {
    const {t, search} = this.props
    const {query, open, results} = search

    const {closeSearch, navigate} = this.props

    const openAsTab = () => {
      closeSearch()
      navigate(`search/${query}`)
    }

    return <div className={classNames('hub-search-results', {active: open})}>
      <div className='header'>
        <h2>{t('search.results.title', {query: query || ''})}</h2>
        <div className='filler'/>
        <span className='icon icon-cross close-search' onClick={closeSearch}/>
      </div>
      {this.resultsGrid(results)}
      <div className='footer'>
        <div className='filler'/>
        <div className='button' onClick={openAsTab}>
          {t('search.open_as_tab')}
        </div>
        <div className='filler'/>
      </div>
    </div>
  }

  resultsGrid (results) {
    if (!results || (results.gameResults.result.gameIds.length === 0 && results.userResults.result.userIds.length === 0)) {
      const {t} = this.props

      return <div className='result-list'>
        <p className='no-results'>{t('search.empty.no_results')}</p>
      </div>
    }

    const items = []
    const {navigateToGame, navigateToUser, closeSearch, t} = this.props

    const {gameResults, userResults} = results
    const {games} = gameResults.entities
    const {users} = userResults.entities

    const {userIds} = userResults.result
    if (userIds.length > 0) {
      items.push(<h3>{t('search.results.creators')}</h3>)
      userResults.result.userIds::each((userId) => {
        const user = users[userId]
        items.push(<UserSearchResult key={`user-${userId}`} user={user} onClick={() => { navigateToUser(user); closeSearch() }}/>)
      })
    }

    const {gameIds} = gameResults.result
    if (gameIds.length > 0) {
      items.push(<h3>{t('search.results.games')}</h3>)
      gameResults.result.gameIds::each((gameId) => {
        const game = games[gameId]
        items.push(<SearchResult key={`game-${gameId}`} game={game} onClick={() => { navigateToGame(game); closeSearch() }}/>)
      })
    }

    return <div className='result-list'>
      {items}
    </div>
  }
}

HubSearchResults.propTypes = {
  search: PropTypes.shape({
    open: PropTypes.bool,
    results: PropTypes.shape({
      result: PropTypes.shape({
        gameIds: PropTypes.array
      }),
      entities: PropTypes.shape({
        games: PropTypes.object
      })
    }),
    example: PropTypes.string
  }),

  navigate: PropTypes.func.isRequired,
  navigateToGame: PropTypes.func.isRequired,
  closeSearch: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  path: (state) => state.session.navigation.path,
  search: (state) => state.session.search
})

const mapDispatchToProps = (dispatch) => ({
  closeSearch: () => dispatch(actions.closeSearch()),
  navigate: (path) => dispatch(actions.navigate(path)),
  navigateToGame: (game) => dispatch(actions.navigateToGame(game)),
  navigateToUser: (user) => dispatch(actions.navigateToUser(user))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSearchResults)
