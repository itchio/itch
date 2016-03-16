
import {handleActions} from 'redux-actions'

const initialState = {
  page: 'gate',
  tabs: {
    constant: [
      {path: 'featured', label: 'Featured'},
      {path: 'dashboard', label: 'My creations'},
      {path: 'library', label: 'Library'}
    ],
    transient: [
      {path: 'collections/2348', icon: 'tag', label: 'Garden, Grow and Plant'},
      {path: 'games/48062', icon: 'gamepad', label: 'Reap'},
      {path: 'games/25491', icon: 'gamepad', label: 'FPV Freerider'},
      {path: 'users/3996', icon: 'users', label: 'Managore'},
      {path: 'collections/25108', icon: 'tag', label: 'I made a Fall Out Boy collection and all I got was wrapping label tabs'}
    ]
  },
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
