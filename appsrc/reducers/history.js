
import invariant from 'invariant'

import {handleActions} from 'redux-actions'
import {createStructuredSelector} from 'reselect'
import {sortBy, omit, map, indexBy} from 'underline'

const initialState = {
  items: {}
}

const reducer = handleActions({
  QUEUE_HISTORY_ITEM: (state, action) => {
    const {payload} = action
    invariant(Array.isArray(payload.label), 'history items must have at least a label (i18n.t args array)')
    invariant(typeof payload.id === 'string', 'history items must have a valid id')
    invariant(typeof payload.date === 'number', 'history items must have a valid timstamp')

    const {items} = state
    return {...state, items: {...items, [payload.id]: payload}}
  },

  DISMISS_HISTORY_ITEM: (state, action) => {
    const {id} = action.payload
    invariant(typeof id === 'string', 'dismissing valid history item')
    const {items} = state
    return {...state, items: items::omit(id)}
  },

  HISTORY_READ: (state, action) => {
    const {items} = state
    const newItems = items::map((item, id) => ({...item, active: false}))::indexBy('id')
    return {...state, items: newItems}
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
