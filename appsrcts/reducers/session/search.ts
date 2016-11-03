
import {handleActions} from 'redux-actions'

import SearchExamples from '../../constants/search-examples'

function randomExampleIndex () {
  return Math.floor(Math.random() * (SearchExamples.length - 1))
}

let searchExampleIndex = randomExampleIndex()

const initialState = {
  example: SearchExamples[searchExampleIndex],
  typedQuery: '',
  query: '',
  open: false,
  loading: false,
  highlight: 0,
  results: null
}

export default handleActions({
  SEARCH: (state, action) => {
    const typedQuery = action.payload
    if (!typedQuery) {
      return state
    }

    return {...state, typedQuery, highlight: 0}
  },

  SEARCH_HIGHLIGHT_OFFSET: (state, action) => {
    const offset = action.payload
    return {...state, highlight: (state.highlight + offset)}
  },

  SEARCH_FETCHED: (state, action) => {
    const {query, results} = action.payload
    const example = SearchExamples[randomExampleIndex()]
    return {...state, results, query, example}
  },

  SEARCH_STARTED: (state, action) => {
    return {...state, loading: true}
  },

  SEARCH_FINISHED: (state, action) => {
    return {...state, loading: false}
  },

  FOCUS_SEARCH: (state, action) => {
    return {...state, open: true}
  },

  CLOSE_SEARCH: (state, action) => {
    return {...state, open: false}
  }
}, initialState)
