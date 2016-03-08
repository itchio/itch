
import {createStore, applyMiddleware, compose} from 'redux'
import {electronEnhancer} from 'redux-electron-store'
import DevTools from '../components/dev-tools'

const filter = true
const middleware = []

const enhancer = compose(
  applyMiddleware(...middleware),
  electronEnhancer({filter}),
  DevTools.instrument()
)

const reducer = (state, action) => state
const initialState = {}
const store = createStore(reducer, initialState, enhancer)

store.subscribe((action) => {
  if (action) {
    console.log(`renderer got action ${action.type}`)
  } else {
    console.log(`renderer got undefined action`)
  }
})

export default store
