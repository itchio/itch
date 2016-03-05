
import {getIn, assocIn, dissocIn} from 'grovel'

/**
 * Take a diff as produced by deep-diff, and apply it to a mori data structure
 */
let patch = (state, diff) => {
  for (let el of diff) {
    switch (el.kind) {
      // array change
      case 'A': {
        let path = el.path.concat([el.index])
        state = state::assocIn(path, el.rhs)
      }
        break

      // new element
      case 'N':
      // edited element
      case 'E': {
        state = state::assocIn(el.path, el.rhs)
      }
        break

      // deleted element
      case 'D': {
        state = state::dissocIn(el.path)
      }
        break
    }
  }

  return state
}

patch.applyAt = (state, path, diff) => {
  let initial = state::getIn(path)
  let patched = patch(initial, diff)
  return state::assocIn(path, patched)
}

export default patch
