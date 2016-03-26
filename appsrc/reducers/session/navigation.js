
import {handleActions} from 'redux-actions'
import {pluck, reject, indexBy} from 'underline'

import SearchExamples from '../../constants/search-examples'

const initialState = {
  page: 'gate',
  tabs: {
    constant: [
      {path: 'featured', label: ['sidebar.featured']},
      {path: 'dashboard', label: ['sidebar.dashboard']},
      {path: 'library', label: ['sidebar.owned']}
    ],
    transient: [
      {path: 'collections/2348', label: 'Garden, Grow and Plant'},
      {path: 'games/48062', label: 'Reap'},
      {path: 'games/25491', label: 'FPV Freerider'},
      {path: 'users/3996', label: 'Managore'},
      {path: 'collections/25108', label: 'I made a Fall Out Boy collection and all I got was wrapping label tabs'}
    ]
  },
  path: 'dashboard'
}

export default handleActions({
  SWITCH_PAGE: (state, action) => {
    const page = action.payload
    return {...state, page}
  },

  NAVIGATE: (state, action) => {
    const path = action.payload

    const {tabs} = state
    const {constant, transient} = tabs
    const tabsByPath = constant.concat(transient)::indexBy('path')

    console.log('navigating to', path, 'tabsByPath: ', tabsByPath)

    if (tabsByPath[path]) {
      return {...state, path}
    } else {
      let label
      if (path === 'preferences') {
        label = ['sidebar.preferences']
      } else if (path === 'history') {
        label = ['sidebar.history']
      } else if (path === 'downloads') {
        label = ['sidebar.downloads']
      }

      const newTab = {
        path,
        label
      }
      const newTabs = {
        constant,
        transient: [
          newTab,
          ...transient
        ]
      }
      return {...state, path, tabs: newTabs}
    }
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
    const searchExampleIndex = Math.floor(Math.random() * (SearchExamples.length - 1))
    return {...state, searchResults: results, searchOpen: true, searchExample: SearchExamples[searchExampleIndex]}
  },

  CLOSE_SEARCH: (state, action) => {
    return {...state, searchResults: null, searchOpen: false}
  }
}, initialState)
