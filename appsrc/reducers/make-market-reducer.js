
import {handleActions} from 'redux-actions'
import invariant from 'invariant'

import {omit} from 'underline'

import * as actionTypes from '../constants/action-types'

export default function makeMarketReducer (prefix, getMarket, tables) {
  const initialState = {
    ready: false
  }
  for (const table of tables) {
    initialState[table] = {}
  }

  const DB_READY = actionTypes[prefix + '_DB_READY']
  invariant(DB_READY, 'ready exists as an action type')

  const DB_COMMIT = actionTypes[prefix + '_DB_COMMIT']
  invariant(DB_COMMIT, 'commit exists as an action type')

  const DB_CLOSED = actionTypes[prefix + '_DB_CLOSED']
  invariant(DB_CLOSED, 'closed exists as an action type')

  return handleActions({
    [DB_READY]: (state, action) => {
      return {...state, ready: true}
    },

    [DB_CLOSED]: (state, action) => {
      return initialState
    },

    [DB_COMMIT]: (state, action) => {
      const {updated = {}, deleted = {}, initial = false} = action.payload
      const market = getMarket()

      for (const tableName of Object.keys(deleted)) {
        const deletedIds = deleted[tableName]
        const updatedTable = (state[tableName] || {})::omit(deletedIds)
        state = {...state, [tableName]: updatedTable}
      }

      for (const tableName of Object.keys(updated)) {
        const updatedIds = updated[tableName]
        const records = market.getEntities(tableName)

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
}
