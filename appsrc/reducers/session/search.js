
import {handleActions} from 'redux-actions'

import SearchExamples from '../../constants/search-examples'

function randomExampleIndex () {
  return Math.floor(Math.random() * (SearchExamples.length - 1))
}

let searchExampleIndex = randomExampleIndex()

const initialState = {
  example: SearchExamples[searchExampleIndex],
  open: false,
  results: null
}

export default handleActions({
  SEARCH_FETCHED: (state, action) => {
    const {results} = action.payload
    const example = SearchExamples[randomExampleIndex()]
    return {...state, results, open: true, example}
  },

  CLOSE_SEARCH: (state, action) => {
    return {...state, results: null, open: false}
  }
}, initialState)
