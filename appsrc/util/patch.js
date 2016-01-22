
import {getIn, assocIn, updateIn, dissoc, toClj} from 'mori-ext'

/**
 * Take a diff as produced by deep-diff, and apply it to a mori data structure
 */
let patch = (state, diff) => {
  for (let el of diff) {
    switch (el.kind) {
      // array change
      case 'A': {
        let path = el.path.concat([el.index])
        state = state::assocIn(path, el.rhs::toClj())
      }
        break

      // new element
      case 'N':
      // edited element
      case 'E': {
        state = state::assocIn(el.path, el.rhs::toClj())
      }
        break

      // deleted element
      case 'D': {
        let path = el.path
        let key = path.pop()

        if (path.length > 0) {
          state = state::updateIn(path, (x) => x::dissoc(key))
        } else {
          state = state::dissoc(key)
        }
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

module.exports = patch
