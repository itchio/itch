
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import {connect} from './connect'

import classNames from 'classnames'

import {search} from '../actions'

import Icon from './icon'

class HubBread extends Component {
  render () {
    const {t, searchLoading} = this.props

    const searchClasses = classNames('search', {loading: searchLoading})

    return <div className='hub-bread'>
      <section className='description'>
        <h2><icon className='icon icon-tag'/> Garden, Grow and Plant</h2>
        <h3>53 games | a collection by Don Whitaker</h3>
      </section>

      <section className='filler'/>

      <section className='icon-button'>
        <Icon icon='sort-alpha-asc'/>
      </section>

      <section className='icon-button'>
        <Icon icon='filter'/>
      </section>

      <section className={searchClasses}>
        <input id='search' ref='search' type='search' placeholder={t('search.placeholder')} onKeyPress={(e) => this.onKeyPress(e)}/>
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

    if (e.key === 'Enter') {
      this.props.search(search.value)
    }
  }

  titleForPath (path) {
    return `page ${path}`
  }
}

HubBread.propTypes = {
  t: PropTypes.func,

  path: PropTypes.string,
  searchLoading: PropTypes.bool,

  search: PropTypes.func,
  closeSearch: PropTypes.func
}

const mapStateToProps = createStructuredSelector({
  path: (state) => state.session.navigation.path,
  searchLoading: (state) => state.session.search.loading
})

const mapDispatchToProps = (dispatch) => ({
  search: (query) => dispatch(search(query))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubBread)
