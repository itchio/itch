
import {handleActions} from 'redux-actions'
import {map, reject, omit, object, pick, indexBy} from 'underline'
import invariant from 'invariant'
import uuid from 'node-uuid'

import SearchExamples from '../../constants/search-examples'
import staticTabData from '../../constants/static-tab-data'

import {filter} from 'underline'

const perish = process.env.PERISH === '1' ? console.log.bind(console) : () => 0

const baseTabs = ['featured', 'library', 'collections']

const initialState = {
  page: 'gate',
  tabs: {
    constant: baseTabs,
    transient: []
  },
  filters: {},
  binaryFilters: {
    onlyCompatible: true
  },
  lastConstant: 'featured',
  tabData: staticTabData::pick(...baseTabs)::indexBy('id'),
  id: 'featured',
  shortcutsShown: false
}

export default handleActions({
  BINARY_FILTER_CHANGED: (state, action) => {
    const {field, value} = action.payload
    const oldBinaryFilters = state.binaryFilters
    return {...state, binaryFilters: {
      ...oldBinaryFilters,
      [field]: value
    }}
  },

  TAB_CHANGED: (state, action) => {
    const {tabs} = state
    const {id} = action.payload
    const {constant} = tabs
    if (!id) return state

    if (constant.indexOf(id) === -1) {
      return state
    }

    return {
      ...state,
      lastConstant: id
    }
  },

  DOWNLOAD_STARTED: (state, action) => {
    const {tabs, tabData} = state
    const {transient} = tabs

    const has = transient.indexOf('downloads') >= 0
    if (has) {
      return state
    }

    return {
      ...state,
      tabs: {
        ...tabs,
        transient: [ ...transient, 'downloads' ]
      },
      tabData: {
        ...tabData,
        downloads: {
          ...staticTabData['downloads'],
          path: 'downloads'
        }
      }
    }
  },

  FILTER_CHANGED: (state, action) => {
    const {tab, query} = action.payload
    const oldFilters = state.filters
    return {...state, filters: {
      ...oldFilters,
      [tab]: query
    }}
  },

  SHORTCUTS_VISIBILITY_CHANGED: (state, action) => {
    const {visible} = action.payload
    return {...state, shortcutsShown: visible}
  },

  SWITCH_PAGE: (state, action) => {
    const page = action.payload
    return {...state, page}
  },

  NAVIGATE: (state, action) => {
    const {id, data, background} = action.payload
    invariant(typeof id === 'string', 'id must be a string')
    invariant(typeof data === 'object', 'data must be an object')

    const {tabData} = state
    const {tabs} = state
    const {constant, transient} = tabs

    const tabsByPath = tabData::map((x, id) => [x.path, id])::object()

    if (tabData[id]) {
      // switching to an existing tab, by id
      if (background) {
        return state
      }
      return {...state, id}
    } else if (tabsByPath[id]) {
      // switching to an existing tab, by path (don't open same game twice, etc.)
      if (background) {
        return state
      }
      const idForPath = tabsByPath[id]
      return {...state, id: idForPath}
    } else {
      // open a new tab
      // static tabs don't get UUIDs
      const newTab = staticTabData[id] ? id : uuid.v4()

      const newTabs = {
        constant,
        transient: [
          ...transient,
          newTab
        ]
      }

      const newTabData = {
        ...tabData,
        [newTab]: {
          ...staticTabData[id],
          ...tabData[id],
          path: id,
          ...data
        }
      }

      return {
        ...state,
        id: background ? state.id : newTab,
        tabs: newTabs,
        tabData: newTabData
      }
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
    const {id, tabs, tabData, history} = state
    const closeId = action.payload || id
    const {constant, transient} = tabs

    if (constant.indexOf(closeId) !== -1) {
      return state
    }

    const ids = constant.concat(transient)
    const index = ids.indexOf(id)

    const newTransient = transient::reject((x) => x === closeId)
    const newTabData = tabData::omit(closeId)

    let newHistory = history
    let newId = id
    if (id === closeId) {
      if (newTransient.length > 0) {
        const newIds = constant.concat(newTransient)
        const numNewIds = newIds.length

        const nextIndex = Math.min(index, numNewIds - 1)
        newId = newIds[nextIndex]
      } else {
        newId = state.lastConstant
      }
    }

    return {
      ...state,
      id: newId,
      tabs: {
        constant,
        transient: newTransient
      },
      history: newHistory,
      tabData: newTabData
    }
  },

  CLOSE_ALL_TABS: (state, action) => {
    const {id, tabs, tabData} = state
    const {constant, transient} = tabs

    const newTabData = tabData::omit(...transient)
    const newId = (constant.indexOf(id) === -1) ? 'featured' : id

    return {
      ...state,
      id: newId,
      tabs: {
        constant,
        transient: []
      },
      tabData: newTabData
    }
  },

  SEARCH_FETCHED: (state, action) => {
    const {results} = action.payload
    const searchExampleIndex = Math.floor(Math.random() * (SearchExamples.length - 1))
    return {...state, searchResults: results, searchOpen: true, searchExample: SearchExamples[searchExampleIndex]}
  },

  TAB_DATA_FETCHED: (state, action) => {
    const {id, timestamp, data} = action.payload
    if (!timestamp) {
      perish('Ignoring non-timestamped tabData: ', id, data)
      return state
    }

    const {tabData} = state
    const oldData = tabData[id]
    if (oldData && oldData.timestamp && oldData.timestamp > timestamp) {
      perish('Ignoring stale tabData: ', id, data)
      return state
    }

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
    const {id, data} = action.payload
    invariant(typeof id === 'string', 'id must be a string')

    const {tabData} = state
    const newTabData = {
      ...tabData,
      [id]: {
        ...tabData[id],
        ...data
      }
    }

    return {
      ...state,
      tabData: newTabData
    }
  },

  TABS_RESTORED: (state, action) => {
    const snapshot = action.payload
    invariant(typeof snapshot === 'object', 'tab snapshot must be an object')

    const id = snapshot.current || state.id
    const tabData = []
    const transient = snapshot.items::map((tab) => {
      if (typeof tab !== 'object' || !tab.id || !tab.path) {
        return
      }

      tabData[tab.id] = {
        path: tab.path
      }
      return tab.id
    })::filter((x) => !!x)

    return {
      ...state,
      id,
      tabs: {
        ...state.tabs,
        transient
      },
      tabData: {
        ...state.tabData,
        ...tabData
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

    return {
      ...state,
      tabs: {
        ...state.tabs,
        constant: [
          ...constant,
          path
        ]
      },
      tabData: {
        ...state.tabData,
        [path]: {
          ...state.tabData[path],
          ...staticTabData[path]
        }
      }
    }
  },

  CLOSE_SEARCH: (state, action) => {
    return {...state, searchResults: null, searchOpen: false}
  }
}, initialState)
