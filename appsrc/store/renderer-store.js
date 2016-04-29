
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-enhancer'
import createLogger from 'redux-logger'
import env from '../env'
import createSagaMiddleware from 'redux-saga'

import sagas from '../renderer-sagas'
import {each} from 'underline'

const filter = true
const sagaMiddleware = createSagaMiddleware()
const middleware = [
  sagaMiddleware
]

if (false && env.name === 'development') {
  const logger = createLogger({
    predicate: (getState, action) => !action.MONITOR_ACTION
  })
  middleware.push(logger)
}

const inject = (action) => store.dispatch(action)

const enhancers = [
  electronEnhancer({inject, filter}),
  applyMiddleware(...middleware)
]

if (env.name === 'development') {
  const DevTools = require('../components/dev-tools').default
  enhancers.push(DevTools.instrument())
}

const enhancer = compose(...enhancers)

const reducer = (state, action) => state
const initialState = {}
const store = createStore(reducer, initialState, enhancer)
sagas::each(::sagaMiddleware.run)

export default store
