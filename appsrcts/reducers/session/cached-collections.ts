
import {handleActions} from 'redux-actions'
import invariant from 'invariant'

const initialState = {
  fetched: {}
}

export default handleActions({
  COLLECTION_GAMES_FETCHED: (state, action) => {
    const {collectionId} = action.payload
    invariant(typeof collectionId === 'number', 'valid collection id')

    const {fetched} = state
    return {...state, fetched: {...fetched, [collectionId]: Date.now()}}
  },

  LOGOUT: (state, action) => {
    return initialState
  }
}, initialState)
