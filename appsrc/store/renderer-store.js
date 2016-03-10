
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-enhancer'
import createLogger from 'redux-logger'
import DevTools from '../components/dev-tools'

const filter = true
const middleware = []

if (process.env.NODE_ENV === 'development') {
  const logger = createLogger({
    predicate: (getState, action) => !action.MONITOR_ACTION
  })
  middleware.push(logger)
}

const inject = (action) => {
  console.log(`injecting `, action)
  store.dispatch(action)
}
const enhancer = compose(
  electronEnhancer({inject, filter}),
  applyMiddleware(...middleware),
  DevTools.instrument()
)

const reducer = (state, action) => state
const initialState = {}
const store = createStore(reducer, initialState, enhancer)

export default store
