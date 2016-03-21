
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {each} from 'underline'

import * as actions from '../actions'

export class SearchResult extends Component {
  render () {
    const {game} = this.props
    const {title, coverUrl} = game

    return <div className='search-result'>
      <img src={coverUrl}/>
      <h4>{title}</h4>
      <div className='spacer'></div>
      <span className='icon-button icon icon-plus'/>
    </div>
  }
}

SearchResult.propTypes = {
  game: PropTypes.shape({
    title: PropTypes.string,
    coverUrl: PropTypes.string
  })
}

export class HubSearchResults extends Component {
  render () {
    const {search, closeSearch} = this.props
    const {open, results} = search

    return <div className={classNames('hub-search-results', {active: open})}>
      <div className='header'>
        <h3>Search results</h3>
        <div className='filler'/>
        <span className='icon icon-cross close-search' onClick={closeSearch}/>
      </div>
      {this.fakeGrid(results)}
    </div>
  }

  fakeGrid (results) {
    if (!results || results.result.gameIds.length === 0) {
      const {t} = this.props

      return <div className='result-list'>
        <p>{t('search.empty.no_results')}</p>
      </div>
    }

    const items = []

    const {games} = results.entities
    results.result.gameIds::each((gameId) => {
      const game = games[gameId]
      items.push(<SearchResult key={gameId} game={game}/>)
    })

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

  closeSearch: PropTypes.func,

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  path: (state) => state.session.navigation.path,
  search: (state) => state.session.search
})

const mapDispatchToProps = (dispatch) => ({
  closeSearch: () => dispatch(actions.closeSearch())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSearchResults)
