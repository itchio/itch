
import {handleActions} from 'redux-actions'

const initialState = {
  messages: []
}

export default handleActions({
  STATUS_MESSAGE: (state, action) => {
    return {
      ...state,
      messages: [
        action.payload,
        ...state.messages
      ]
    }
  },

  DISMISS_STATUS_MESSAGE: (state, action) => {
    return {
      ...state,
      messages: state.messages.slice(1)
    }
  }
}, initialState)
