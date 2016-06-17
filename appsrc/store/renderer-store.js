
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'
import createLogger from 'redux-logger'

import route from '../reactors/route'
import reactors from '../renderer-reactors'
import reducer from '../reducers'

const filter = true
const middleware = []

const REDUX_DEVTOOLS_ENABLED = process.env.REDUX_DEVTOOLS === '1'

if (REDUX_DEVTOOLS_ENABLED) {
  const logger = createLogger({
    predicate: (getState, action) => !action.MONITOR_ACTION
  })
  middleware.push(logger)
}

const allAction = Object.freeze({type: '__ALL', payload: null})
const enhancers = [
  electronEnhancer({
    filter,
    synchronous: false,
    postDispatchCallback: (action) => {
      route(reactors, store, action)
      route(reactors, store, allAction)
    }
  }),
  applyMiddleware(...middleware)
]

if (REDUX_DEVTOOLS_ENABLED) {
  const DevTools = require('../components/dev-tools').default
  enhancers.push(DevTools.instrument())
}

const enhancer = compose(...enhancers)

const initialState = {}
const store = createStore(reducer, initialState, enhancer)
route(reactors, store, {type: '__MOUNT', payload: null})

export default store
