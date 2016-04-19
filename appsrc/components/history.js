
import React, {Component, PropTypes} from 'react'
import {connect} from './connect'
import {createStructuredSelector} from 'reselect'
import invariant from 'invariant'

import {map} from 'underline'

import TimeAgo from 'react-timeago'

import * as actions from '../actions'

class History extends Component {
  render () {
    const {t, pickOption, items} = this.props

    return <ul className='history-page'>
    {items::map((item) => {
      const {label, date, id, options = []} = item
      return <li key={id} className='history-item'>
        <div className='item-description'>
          {t.format(label)}
          <div className='timeago'>
            <TimeAgo date={date}/>
          </div>
        </div>
        <div className='item-options'>
          {options::map((option) => {
            return <div className='item-option' onClick={(e) => pickOption(id, option)}>
              {t.format(option.label)}
            </div>
          })}
        </div>
      </li>
    })}
    </ul>
  }
}

History.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.array
  })),

  t: PropTypes.func.isRequired,
  pickOption: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  items: (state) => state.history.itemsByDate
})

const mapDispatchToProps = (dispatch) => ({
  pickOption: (itemId, option) => {
    invariant(itemId, 'have item id')
    if (option.action) {
      dispatch(option.action)
    }
    dispatch(actions.dismissHistoryItem({id: itemId}))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(History)
