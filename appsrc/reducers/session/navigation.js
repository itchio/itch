
import {handleActions} from 'redux-actions'

const initialState = {
  page: 'gate',
  path: 'dashboard',
  searchOpen: false,
  searchResults: []
}

export default handleActions({
  SWITCH_PAGE: (state, action) => {
    const page = action.payload
    return {...state, page}
  },

  NAVIGATE: (state, action) => {
    const path = action.payload
    return {...state, path}
  },

  SEARCH_FETCHED: (state, action) => {
    const {results} = action.payload
    return {...state, searchResults: results, searchOpen: true}
  },

  CLOSE_SEARCH: (state, action) => {
    return {...state, searchResults: [], searchOpen: false}
  }
}, initialState)
