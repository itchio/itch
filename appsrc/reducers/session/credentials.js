
import {handleActions} from 'redux-actions'

const initialState = {
  key: null,
  me: null
}

export default handleActions({
  LOGIN_SUCCEEDED: (state, action) => {
    const {key, me} = action.payload
    return {...state, key, me}
  },

  LOGOUT: (state, action) => {
    return {...state, key: null, me: null}
  }
}, initialState)
