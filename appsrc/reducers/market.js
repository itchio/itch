
import {handleActions} from 'redux-actions'
import {getEntities} from '../sagas/market'

import {omit} from 'underline'

const initialState = {
  ready: false,
  entities: {}
}

export default handleActions({
  LOGOUT: (state, action) => {
    return initialState
  },

  DB_COMMIT: (state, action) => {
    const {updated = {}, deleted = {}, initial = false} = action.payload

    for (const tableName of Object.keys(deleted)) {
      const deletedIds = deleted[tableName]
      const updatedTable = (state[tableName] || {})::omit(deletedIds)
      state = {...state, [tableName]: updatedTable}
    }

    for (const tableName of Object.keys(updated)) {
      const updatedIds = updated[tableName]
      const records = getEntities(tableName)

      let updatedTable = (state[tableName] || {})
      for (const recordId of updatedIds) {
        updatedTable = {...updatedTable, [recordId]: records[recordId]}
      }
      state = {...state, [tableName]: updatedTable}
    }

    if (initial) {
      state = {...state, ready: true}
    }
    return state
  }
}, initialState)
