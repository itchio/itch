
import {handleActions} from 'redux-actions'
import {map, pluck, reject, indexBy} from 'underline'
import invariant from 'invariant'
import uuid from 'node-uuid'

import SearchExamples from '../../constants/search-examples'
import staticTabData from '../../constants/static-tab-data'

import {filter} from 'underline'

const initialState = {
  page: 'gate',
  tabs: {
    constant: [
      {path: 'featured', id: 'featured'},
      {path: 'library', id: 'library'}
    ],
    transient: []
  },
  tabData: staticTabData,
  id: 'featured',
  shortcutsShown: false
}

export default handleActions({
  SHORTCUTS_VISIBILITY_CHANGED: (state, action) => {
    const {visible} = action.payload
    return {...state, shortcutsShown: visible}
  },

  SWITCH_PAGE: (state, action) => {
    const page = action.payload
    return {...state, page}
  },

  NAVIGATE: (state, action) => {
    const {id, data} = action.payload
    invariant(typeof id === 'string', 'id must be a string')
    invariant(typeof data === 'object', 'data must be an object')

    const {tabData} = state
    const {tabs} = state
    const {constant, transient} = tabs
    const tabsById = constant.concat(transient)::indexBy('id')

    if (tabsById[id]) {
      // switching to an existing tab
      return {...state, id}
    } else {
      // open a new tab
      const newTab = {
        // static tabs don't get UUIDs
        id: staticTabData[id] ? id : uuid.v4(),
        path: id
      }

      const newTabs = {
        constant,
        transient: [
          ...transient,
          newTab
        ]
      }

      const newTabData = {
        ...tabData,
        [id]: {
          ...tabData[id],
          ...data
        }
      }

      return {...state, id: newTab.id, tabs: newTabs, tabData: newTabData}
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
    const {id, tabs} = state
    const closeId = action.payload || id
    const {constant, transient} = tabs

    const ids = constant::pluck('id').concat(transient::pluck('id'))
    const index = ids.indexOf(id)

    const newTransient = transient::reject((x) => x.id === closeId)

    const newIds = constant::pluck('id').concat(newTransient::pluck('id'))
    const numNewIds = newIds.length

    const nextIndex = Math.min(index, numNewIds - 1)
    const newId = newIds[nextIndex]

    return {
      ...state,
      id: newId,
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
    const {id, data} = action.payload
    const {tabData} = state
    const newTabData = {
      ...tabData,
      [id]: {
        ...tabData[id],
        ...data
      }
    }

    return {...state, tabData: newTabData}
  },

  TAB_EVOLVED: (state, action) => {
    const {id, path, data} = action.payload
    invariant(typeof id === 'string', 'id must be a string')
    invariant(typeof path === 'string', 'after path must be a string')

    const {tabData} = state
    const newTabData = {
      ...tabData,
      [id]: {
        ...tabData[id],
        ...data
      }
    }

    const newTransient = state.transient::map((tab) => {
      if (tab.id === id) {
        return {
          ...tab,
          path
        }
      }
    })

    return {
      ...state,
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

    const {id} = state
    const transient = snapshot.items::filter((tab) => typeof tab === 'object')

    return {
      ...state,
      id,
      tabs: {
        ...state.tabs,
        transient
      }
    }
  },

  LOGOUT: (state, action) => {
    return initialState
  },

  // happens after SESSION_READY depending on the user's profile (press, developer)
  UNLOCK_TAB: (state, action) => {
    const {path} = action.payload
    invariant(typeof path === 'string', 'unlocked tab path must be a string')

    const {constant} = state.tabs

    const tab = {
      path,
      id: path
    }

    return {
      ...state,
      tabs: {
        ...state.tabs,
        constant: [
          ...constant,
          tab
        ]
      }
    }
  },

  CLOSE_SEARCH: (state, action) => {
    return {...state, searchResults: null, searchOpen: false}
  }
}, initialState)
