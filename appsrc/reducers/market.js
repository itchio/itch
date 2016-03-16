
import {handleActions} from 'redux-actions'
import {getEntities} from '../sagas/market'

import {omit} from 'underline'

const initialState = {
  ready: false,
  entities: {}
}

export default handleActions({
  LOGIN_SUCCEEDED: (state, action) => {
    return {...state}
  },

  LOGOUT: (state, action) => {
    return initialState
  },

  DB_COMMIT: (state, action) => {
    const {updated, deleted, initial} = action

    for (const tableName in Object.keys(deleted)) {
      const deletedIds = deleted[tableName]
      const updatedTable = (state[tableName] || {})::omit(deletedIds)
      state = {...state, [tableName]: updatedTable}
    }

    for (const tableName in Object.keys(updated)) {
      const records = getEntities(tableName)
      const updatedRecords = updated[tableName]

      let updatedTable = (state[tableName] || {})
      for (const recordId in Object.keys(updatedRecords)) {
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
