
// import {omit} from 'underline'

import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'
import thunk from 'redux-thunk'
import createLogger from 'redux-cli-logger'
import createSagaMiddleware from 'redux-saga'

import sagas from '../sagas'
import reducer from '../reducers'

const middleware = [
  thunk
]

const devMiddleware = []

if (process.env.NODE_ENV === 'development') {
  const logger = createLogger({
    predicate: (getState, action) => !action.MONITOR_ACTION,
    // stateTransformer: (state) => state::omit('ui')
    stateTransformer: (state) => ''
  })

  devMiddleware.push(logger)
}

const sagaMiddleware = applyMiddleware(createSagaMiddleware(...sagas))

let store
const inject = (action) => store.dispatch(action)

const enhancer = compose(
  applyMiddleware(...middleware),
  sagaMiddleware,
  electronEnhancer({inject}),
  applyMiddleware(...devMiddleware)
)

const initialState = {}
store = createStore(reducer, initialState, enhancer)

// setInterval(function () {
//   store.dispatch({type: 'HI_FROM_BROWSER'})
// }, 1000)

export default store
