
import {handleActions} from 'redux-actions'

const initialState = {
  page: 'login'
}

export default handleActions({
  NAVIGATE: (state, action) => {
    const path = action.payload
    return {...state, path}
  }
}, initialState)
