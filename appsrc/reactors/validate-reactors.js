
import actionTypes from '../constants/action-types'
import {each} from 'underline'

export default function validateReactors (reactors) {
  Object.keys(reactors)::each((key) => {
    if (key === '_ALL') {
      return
    }
    if (!actionTypes[key]) {
      throw new Error(`trying to react to unknown action type ${key}`)
    }
  })
  return reactors
}
