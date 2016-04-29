
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import {connect} from './connect'

import classNames from 'classnames'

import * as actions from '../actions'
import urls from '../constants/urls'

import Icon from './icon'
import HubBreadDescription from './hub-bread-description'

import os from '../util/os'
const osx = os.itchPlatform() === 'osx'

class HubBread extends Component {
  render () {
    const {t, navigate, searchLoading} = this.props

    const searchClasses = classNames('search', {loading: searchLoading})
    const hideStyle = {display: 'none'}

    return <div className='hub-bread'>
      <HubBreadDescription/>

      <section className='filler'/>

      <section style={hideStyle} className='icon-button'>
        <Icon icon='sort-alpha-asc'/>
      </section>

      <section style={hideStyle} className='icon-button'>
        <Icon icon='filter'/>
      </section>

      <section className={searchClasses}>
        <input id='search' ref='search' type='search' placeholder={t('search.placeholder')} onKeyPress={::this.onKeyPress} onKeyUp={::this.onQueryChanged()} onChange={::this.onQueryChanged}/>
        <span className='icon icon-search'/>
        <div className='kb-shortcut'>
        {osx
          ? <Icon icon='command'/>
          : <Icon icon='ctrl'/>
        }
        +F
        </div>
      </section>

      <section className='icon-button' onClick={() => navigate('url/' + urls.manual)}>
        <Icon icon='lifebuoy'/>
      </section>

      <section style={hideStyle} className='icon-button'>
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
  searchQueryChanged: PropTypes.func.isRequired,
  navigate: PropTypes.func
}

const mapStateToProps = createStructuredSelector({
  path: (state) => state.session.navigation.path,
  searchLoading: (state) => state.session.search.loading
})

const mapDispatchToProps = (dispatch) => ({
  search: (query) => dispatch(actions.search(query)),
  searchQueryChanged: (query) => dispatch(actions.searchQueryChanged(query)),
  navigate: (a, b) => dispatch(actions.navigate(a, b))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubBread)
