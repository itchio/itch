
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-enhancer'
import createLogger from 'redux-cli-logger'
import createSagaMiddleware from 'redux-saga'

import sagas from '../sagas'
import reducer from '../reducers'

const crashGetter = (store) => (next) => (action) => {
  try {
    if (action && !action.type) {
      throw new Error(`refusing to dispatch action with null type: `, action)
    }
    return next(action)
  } catch (e) {
    console.log(`Uncaught redux: for action ${action.type}: ${e.stack}`)
  }
}

const middleware = [
  crashGetter,
  createSagaMiddleware(...sagas)
]

const beChatty = process.env.MARCO_POLO === '1'

const devMiddleware = []
if (beChatty) {
  const logger = createLogger({
    predicate: (getState, action) => !action.MONITOR_ACTION && !/^WINDOW_/.test(action.type) && !/_DB_/.test(action.type),
    stateTransformer: (state) => ''
  })

  devMiddleware.push(logger)
}

const inject = (action) => store.dispatch(action)
const enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer({inject}),
  applyMiddleware(...devMiddleware)
)

const initialState = {}
const store = createStore(reducer, initialState, enhancer)

export default store
