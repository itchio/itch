
import {handleActions} from 'redux-actions'

import {OPERATION_FAILED} from '../../constants/operation-types'

const initialState = {
  items: []
}

export default handleActions({
  OPERATION_FAILED: (state, action) => {
    const {payload} = action
    const {items} = state.items.concat({...payload, type: OPERATION_FAILED})
    return {...state, items}
  }
}, initialState)
