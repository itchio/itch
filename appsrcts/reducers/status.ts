
import {handleActions} from 'redux-actions'

const initialState = {
  messages: [],
  bonuses: {}
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
  },

  ENABLE_BONUS: (state, action) => {
    const bonusName = action.payload.name

    return {
      ...state,
      bonuses: {
        ...state.bonuses,
        [bonusName]: true
      }
    }
  },

  DISABLE_BONUS: (state, action) => {
    const bonusName = action.payload.name

    return {
      ...state,
      bonuses: {
        ...state.bonuses,
        [bonusName]: false
      }
    }
  }
}, initialState)
