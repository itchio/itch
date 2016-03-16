
import {handleActions} from 'redux-actions'
import {pluck, reject} from 'underline'

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

  CLOSE_TAB: (state, action) => {
    const {path, tabs} = state
    const closePath = action.payload || path
    const {constant, transient} = tabs

    const paths = constant::pluck('path').concat(transient::pluck('path'))

    const index = paths.indexOf(path)

    const newTransient = transient::reject((x) => x.path === closePath)

    const newPaths = constant::pluck('path').concat(newTransient::pluck('path'))
    const numNewPaths = newPaths.length

    const nextIndex = Math.min(index, numNewPaths - 1)
    const newPath = newPaths[nextIndex]

    return {
      ...state,
      path: newPath,
      tabs: {
        constant,
        transient: newTransient
      }
    }
  },

  SEARCH_FETCHED: (state, action) => {
    const {results} = action.payload
    return {...state, searchResults: results, searchOpen: true}
  },

  CLOSE_SEARCH: (state, action) => {
    return {...state, searchResults: [], searchOpen: false}
  }
}, initialState)
