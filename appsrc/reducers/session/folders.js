
import {handleActions} from 'redux-actions'
import path from 'path'
import {app} from '../../electron'

const initialState = {
  libraryDir: null
}

export default handleActions({
  LOGIN_SUCCEEDED: (state, action) => {
    const {me} = action.payload
    const libraryDir = path.join(app.getPath('userData'), 'users', '' + me.id)
    return {...state, libraryDir}
  },

  LOGOUT: (state, action) => {
    return initialState
  }
}, initialState)
