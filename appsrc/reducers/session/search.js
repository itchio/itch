
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
  results: null
}

export default handleActions({
  SEARCH: (state, action) => {
    const typedQuery = action.payload
    if (!typedQuery) {
      return state
    }

    return {...state, typedQuery}
  },

  SEARCH_FETCHED: (state, action) => {
    const {query, results} = action.payload
    const example = SearchExamples[randomExampleIndex()]
    return {...state, results, open: true, query, example}
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
