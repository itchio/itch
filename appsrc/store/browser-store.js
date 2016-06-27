
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'

import route from '../reactors/route'
import reactors from '../reactors'
import reducer from '../reducers'

const crashGetter = (store) => (next) => (action) => {
  try {
    if (action && !action.type) {
      throw new Error('refusing to dispatch action with null type: ', action)
    }
    return next(action)
  } catch (e) {
    console.log(`Uncaught redux: for action ${action.type}: ${e.stack}`)
  }
}

const middleware = [
  crashGetter
]

const beChatty = process.env.MARCO_POLO === '1'

if (beChatty) {
  const createLogger = require('redux-cli-logger').default
  const logger = createLogger({
    predicate: (getState, action) => {
      return !action.MONITOR_ACTION &&
         !/^WINDOW_/.test(action.type) &&
         !/_DB_/.test(action.type) &&
         !/LOCALE_/.test(action.type)
    },
    stateTransformer: (state) => ''
  })

  middleware.push(logger)
}

const allAction = Object.freeze({type: '__ALL', payload: null})
const enhancer = compose(
  electronEnhancer({
    postDispatchCallback: (action) => {
      route(reactors, store, action)
      route(reactors, store, allAction)
    }
  }),
  applyMiddleware(...middleware)
)

const initialState = {}
const store = createStore(reducer, initialState, enhancer)
route(reactors, store, {type: '__MOUNT', payload: null})

export default store
