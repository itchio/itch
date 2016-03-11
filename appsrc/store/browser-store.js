
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-enhancer'
import thunk from 'redux-thunk'
import createLogger from 'redux-cli-logger'
import createSagaMiddleware from 'redux-saga'

import sagas from '../sagas'
import reducer from '../reducers'
import env from '../env'

const middleware = [
  createSagaMiddleware(...sagas),
  thunk
]

const devMiddleware = []
if (false && env.name === 'development') {
  const logger = createLogger({
    predicate: (getState, action) => !action.MONITOR_ACTION,
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
