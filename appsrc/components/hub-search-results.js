
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

export class SearchResult extends Component {
  render () {
    const {game} = this.props
    const {title, coverUrl} = game

    return <div className='search_result'>
      <img src={coverUrl}/>
      <h4>{title}</h4>
      <div className='spacer'></div>
      <span className='icon_button icon icon-plus'/>
    </div>
  }
}

SearchResult.propTypes = {
  game: PropTypes.shape({
    title: PropTypes.string,
    coverUrl: PropTypes.string
  })
}

const fakeIcon = 'http://www.gamezebo.com/wp-content/uploads/2014/11/4359181.jpg'

export class HubSearchResults extends Component {
  render () {
    const {searchOpen, searchResults} = this.props

    return <div className={classNames('hub_search_results', {active: searchOpen})}>
      <h3>Here are your search results: </h3>
      {this.fakeGrid(searchResults)}
    </div>
  }

  fakeGrid (searchResults) {
    const items = []
    let id = 0

    for (let i = 0; i < 9; i++) {
      items.push(<SearchResult key={id++} game={{title: 'XCOM: Enemy Unknown', coverUrl: fakeIcon}}/>)
    }

    return <div className='result_list'>
      {items}
    </div>
  }
}

HubSearchResults.propTypes = {
  searchOpen: PropTypes.bool,
  searchResults: PropTypes.array,

  t: PropTypes.func
}

const mapStateToProps = createStructuredSelector({
  path: (state) => state.session.navigation.path,
  searchOpen: (state) => state.session.navigation.searchOpen,
  searchResults: (state) => state.session.navigation.searchResults
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubSearchResults)
