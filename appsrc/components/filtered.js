
import {connect} from './connect'
import React, {Component} from 'react'

import {createStructuredSelector} from 'reselect'
import {searchQueryChanged} from '../actions'

const mapStateToProps = createStructuredSelector({
  typedQuery: (state) => state.session.search.typedQuery
})

const mapDispatchToProps = (dispatch) => ({
  clearSearchFilter: () => dispatch(searchQueryChanged(''))
})

export const EnhanceFiltered = function (BaseComponent) {
  const EnhancedComponent = class extends Component {
    render () {
      const {t, typedQuery} = this.props
      const {clearSearchFilter} = this.props

      let query = ''

      // latin is overrated
      const criterions = []

      if (typedQuery && typedQuery.length > 0) {
        query = typedQuery

        criterions.push(<div key='criterion-search' className='criterion filter-info'>
          <span className='label'>{t('grid.criterion.filtered_by', {term: typedQuery})}</span>
          <span className='remove-filter icon icon-cross' onClick={clearSearchFilter}/>
        </div>)
      }

      return <div className='filtered-meat'>
        {criterions.length > 0
          ? <div className='criterion-bar'>
            {criterions}
          </div>
          : ''
        }
        <div className='sub-meat'>
          <BaseComponent {...this.props} query={query}/>
        </div>
      </div>
    }
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(EnhancedComponent)
}

export default EnhanceFiltered
