
import {handleActions} from 'redux-actions'

const initialState = {
  active: false
}

export default handleActions({
  START_ONBOARDING: (state, action) => {
    return {...state, active: true}
  },

  END_ONBOARDING: (state, action) => {
    return initialState
  }
}, initialState)
