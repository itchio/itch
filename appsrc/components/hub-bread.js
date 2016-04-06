
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import {connect} from './connect'

import classNames from 'classnames'

import * as actions from '../actions'

import Icon from './icon'
import HubBreadDescription from './hub-bread-description'

class HubBread extends Component {
  render () {
    const {t, searchLoading} = this.props

    const searchClasses = classNames('search', {loading: searchLoading})

    return <div className='hub-bread'>
      <HubBreadDescription/>

      <section className='filler'/>

      <section className='icon-button'>
        <Icon icon='sort-alpha-asc'/>
      </section>

      <section className='icon-button'>
        <Icon icon='filter'/>
      </section>

      <section className={searchClasses}>
        <input id='search' ref='search' type='search' placeholder={t('search.placeholder')} onKeyPress={::this.onKeyPress} onKeyUp={::this.onQueryChanged()} onChange={::this.onQueryChanged}/>
        <span className='icon icon-search'/>
      </section>

      <section className='icon-button'>
        <Icon icon='lifebuoy'/>
      </section>

      <section className='icon-button'>
        <Icon icon='menu'/>
      </section>
    </div>
  }

  onKeyPress (e) {
    const {search} = this.refs
    if (!search) return

    if (e.key === 'Enter') {
      this.props.search(search.value)
    }
  }

  onQueryChanged (e) {
    const {search} = this.refs
    if (!search) return

    this.props.searchQueryChanged(search.value)
  }

  titleForPath (path) {
    return `page ${path}`
  }
}

HubBread.propTypes = {
  t: PropTypes.func,

  path: PropTypes.string,
  searchLoading: PropTypes.bool,

  search: PropTypes.func.isRequired,
  searchQueryChanged: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  path: (state) => state.session.navigation.path,
  searchLoading: (state) => state.session.search.loading
})

const mapDispatchToProps = (dispatch) => ({
  search: (query) => dispatch(actions.search(query)),
  searchQueryChanged: (query) => dispatch(actions.searchQueryChanged(query))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubBread)
