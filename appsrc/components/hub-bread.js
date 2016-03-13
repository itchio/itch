
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import {connect} from './connect'

import {searchFetched, closeSearch} from '../actions'

class HubBread extends Component {
  render () {
    const {t, path} = this.props

    return <div className='hub_bread'>
      <section>
        <h2><icon className='icon icon-tag'/> {this.titleForPath(path)}</h2>
        <div className='hub_subtitle'>
        <p>so many elements</p>
        <span className='separator'/>
        <p>a collection by leafbro himself</p>
        </div>
      </section>

      <section className='filler'>
      </section>

      <section>
        <span className='icon_button icon icon-sort-alpha-asc'></span>
      </section>

      <section>
        <span className='icon_button icon icon-filter'></span>
      </section>

      <section>
        <input ref='search' type='search' placeholder={t('search.placeholder')} onChange={this.onChange.bind(this)} onKeyPress={this.onChange.bind(this)}/>
      </section>

      <section>
        <span className='icon_button icon icon-lifebuoy'></span>
      </section>

      <section>
        <span className='icon_button icon icon-menu'></span>
      </section>
    </div>
  }

  onChange () {
    if (this.refs.search.value.length > 0) {
      this.props.openSearch()
    } else {
      this.props.closeSearch()
    }
  }

  titleForPath (path) {
    return `page ${path}`
  }
}

HubBread.propTypes = {
  t: PropTypes.func,

  path: PropTypes.string,

  openSearch: PropTypes.func,
  closeSearch: PropTypes.func
}

const mapStateToProps = createStructuredSelector({
  path: (state) => state.session.navigation.path,
  searchOpen: (state) => state.session.navigation.searchOpen,
  searchResults: (state) => state.session.navigation.searchResults
})

const mapDispatchToProps = (dispatch) => ({
  openSearch: () => dispatch(searchFetched({results: []})),
  closeSearch: () => dispatch(closeSearch({results: []}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubBread)
