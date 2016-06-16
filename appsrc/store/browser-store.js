
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'
import createLogger from 'redux-cli-logger'
import createSagaMiddleware from 'redux-saga'

import sagas from '../sagas'
import nonSagas from '../non-sagas'
import reducer from '../reducers'

import {each} from 'underline'

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

const sagaMiddleware = createSagaMiddleware()

const middleware = [
  crashGetter,
  sagaMiddleware
]

const beChatty = process.env.MARCO_POLO === '1'

if (beChatty) {
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

const enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer({
    postDispatchCallback: (action) => {
      const nonSaga = nonSagas[action.type]
      if (nonSaga) {
        console.log('reacting to: ', action.type)
        nonSaga(store, action)
      }
    }
  })
)

const initialState = {}
const store = createStore(reducer, initialState, enhancer)
sagas::each(::sagaMiddleware.run)

export default store
