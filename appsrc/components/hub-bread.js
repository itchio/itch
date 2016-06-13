
import React, {Component, PropTypes} from 'react'
import {createStructuredSelector} from 'reselect'
import {connect} from './connect'

import * as actions from '../actions'
import urls from '../constants/urls'

import Icon from './icon'
import HubBreadDescription from './hub-bread-description'

class HubBread extends Component {
  render () {
    const {navigate} = this.props

    return <div className='hub-bread'>
      <HubBreadDescription/>

      <section className='filler'/>

      <section className='icon-button' onClick={() => navigate('url/' + urls.manual)}>
        <Icon icon='lifebuoy'/>
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
}

HubBread.propTypes = {
  t: PropTypes.func,

  id: PropTypes.string.isRequired,
  navigate: PropTypes.func
}

const mapStateToProps = createStructuredSelector({
  id: (state) => state.session.navigation.id,
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
