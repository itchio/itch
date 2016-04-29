
import {handleActions} from 'redux-actions'
import {each, map, filter, pluck, reject, indexBy} from 'underline'
import invariant from 'invariant'
import uuid from 'node-uuid'

import SearchExamples from '../../constants/search-examples'
import staticTabData from '../../constants/static-tab-data'
import {pathToId} from '../../util/navigation'

const initialState = {
  page: 'gate',
  tabs: {
    constant: [
      {path: 'featured'},
      {path: 'dashboard'},
      {path: 'library'}
    ],
    transient: []
  },
  tabData: staticTabData,
  path: 'featured'
}

export default handleActions({
  SWITCH_PAGE: (state, action) => {
    const page = action.payload
    return {...state, page}
  },

  NAVIGATE: (state, action) => {
    const {path, data} = action.payload
    invariant(typeof path === 'string', 'path must be a string')
    invariant(typeof data === 'object', 'data must be an object')

    const {tabData} = state
    const {tabs} = state
    const {constant, transient} = tabs
    const tabsByPath = constant.concat(transient)::indexBy('path')

    if (tabsByPath[path]) {
      return {...state, path}
    } else {
      let label
      if (/^search/.test(path)) {
        label = pathToId(path)
      }

      const newTab = {
        path,
        id: uuid.v4()
      }

      const newTabs = {
        constant,
        transient: [
          newTab,
          ...transient
        ]
      }

      const newTabData = {
        ...tabData,
        [path]: {
          ...tabData[path],
          label,
          ...data
        }
      }

      return {...state, path, tabs: newTabs, tabData: newTabData}
    }
  },

  MOVE_TAB: (state, action) => {
    const {before, after} = action.payload
    invariant(typeof before === 'number', 'old tab index is a number')
    invariant(typeof after === 'number', 'new tab index is a number')

    const {tabs} = state
    const {transient} = tabs

    const newTransient = transient::map((t, i) => {
      switch (i) {
        case before:
          return transient[after]
        case after:
          return transient[before]
        default:
          return t
      }
    })

    return {
      ...state,
      tabs: {
        ...tabs,
        transient: newTransient
      }
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

  TAB_DATA_FETCHED: (state, action) => {
    const {path, data} = action.payload
    const {tabData} = state
    const newTabData = {
      ...tabData,
      [path]: {
        ...tabData[path],
        ...data
      }
    }

    return {...state, tabData: newTabData}
  },

  TAB_EVOLVED: (state, action) => {
    const {before, after, data} = action.payload
    invariant(typeof before === 'string', 'before path must be a string')
    invariant(typeof after === 'string', 'after path must be a string')

    const pathMap = {}
    state.tabs.transient::each((t) => { pathMap[t.path] = true })

    const newTransient = state.tabs.transient::map((t) => {
      if (t.path === before) {
        if (pathMap[after]) {
          return null
        }
        return { ...t, path: after }
      } else {
        return t
      }
    })::filter((x) => x)

    const newTabData = {
      ...state.tabData,
      [after]: {
        ...state.tabData[after],
        ...data
      }
    }

    return {
      ...state,
      path: state.path === before ? after : state.path,
      tabs: {
        ...state.tabs,
        transient: newTransient
      },
      tabData: newTabData
    }
  },

  TABS_RESTORED: (state, action) => {
    const snapshot = action.payload
    invariant(typeof snapshot === 'object', 'tab snapshot must be an object')

    return {
      ...state,
      path: snapshot.current,
      tabs: {
        ...state.tabs,
        transient: snapshot.items::map((x) => ({path: x, id: uuid.v4()}))
      }
    }
  },

  LOGOUT: (state, action) => {
    return initialState
  },

  CLOSE_SEARCH: (state, action) => {
    return {...state, searchResults: null, searchOpen: false}
  }
}, initialState)
