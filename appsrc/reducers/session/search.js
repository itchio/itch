
import {handleActions} from 'redux-actions'

import SearchExamples from '../../constants/search-examples'

function randomExampleIndex () {
  return Math.floor(Math.random() * (SearchExamples.length - 1))
}

let searchExampleIndex = randomExampleIndex()

const initialState = {
  example: SearchExamples[searchExampleIndex],
  query: '',
  open: false,
  loading: false,
  results: null
}

export default handleActions({
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

  CLOSE_SEARCH: (state, action) => {
    return {...state, results: null, open: false}
  }
}, initialState)
