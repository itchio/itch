
import React, {Component, PropTypes} from 'react'
import classNames from 'classnames'

import {connect} from './connect'
import {createStructuredSelector} from 'reselect'

import {HubItem} from './hub-item'

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
      items.push(<HubItem key={id++}/>)
    }

    return <div className='hub_grid'>
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
