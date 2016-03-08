
import {omit} from 'underline'

import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'
import {install as reduxLoop} from 'redux-loop'
import thunk from 'redux-thunk'
import createLogger from 'redux-node-logger'
import reducer from '../reducers'

const logger = createLogger({
  stateTransformer: (state) => state::omit('ui')
})

const middleware = [
  thunk,
  logger
]

const enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer(),
  reduxLoop()
)

const initialState = {}
const store = createStore(reducer, initialState, enhancer)

export default store
