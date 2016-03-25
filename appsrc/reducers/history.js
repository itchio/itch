
import uuid from 'node-uuid'
import invariant from 'invariant'

import {handleActions} from 'redux-actions'
import {createStructuredSelector} from 'reselect'
import {sortBy, omit} from 'underline'

const initialState = {
  items: {}
}

const reducer = handleActions({
  QUEUE_HISTORY_ITEM: (state, action) => {
    const {payload} = action
    invariant(typeof payload.label === 'string', 'history items must have at least a label')

    const item = {
      id: uuid.v4(),
      date: Date.now(),
      ...payload
    }

    const {items} = state
    return {...state, items: {...items, item}}
  },

  DISMISS_HISTORY_ITEM: (state, action) => {
    const {id} = action.payload
    invariant(typeof id === 'string', 'dismissing valid history item')
    const {items} = state
    return {...state, items: items::omit(id)}
  }
}, initialState)

const selector = createStructuredSelector({
  itemsByDate: (state) => state.items::sortBy((x) => -x.date)
})

export default (state, action) => {
  const reducerFields = reducer(state, action)
  const additionalFields = selector(reducerFields)
  return {...reducerFields, ...additionalFields}
}
