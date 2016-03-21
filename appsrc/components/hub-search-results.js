
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {each} from 'underline'

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
    const {searchOpen, searchResults} = this.props

    return <div className={classNames('hub-search-results', {active: searchOpen})}>
      <h3>Search results: </h3>
      {this.fakeGrid(searchResults)}
    </div>
  }

  fakeGrid (searchResults) {
    if (!searchResults || searchResults.result.gameIds.length === 0) {
      const {t} = this.props

      return <div className='result-list'>
        <p>{t('search.empty.no_results')}</p>
      </div>
    }

    const items = []

    const {games} = searchResults.entities
    searchResults.result.gameIds::each((gameId) => {
      const game = games[gameId]
      items.push(<SearchResult key={gameId} game={game}/>)
    })

    return <div className='result-list'>
      {items}
    </div>
  }
}

HubSearchResults.propTypes = {
  searchOpen: PropTypes.bool,
  searchResults: PropTypes.shape({
    result: PropTypes.shape({
      gameIds: PropTypes.array
    }),
    entities: PropTypes.shape({
      games: PropTypes.object
    })
  }),
  searchExample: PropTypes.string,

  t: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  path: (state) => state.session.navigation.path,
  searchOpen: (state) => state.session.navigation.searchOpen,
  searchResults: (state) => state.session.navigation.searchResults,
  searchExample: (state) => state.session.navigation.searchExample
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSearchResults)
