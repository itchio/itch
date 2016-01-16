
let mori = require('mori')

/**
 * Take a diff as produced by deep-diff, and apply it to a mori data structure
 */
let patch = (state, diff) => {
  for (let el of diff) {
    switch (el.kind) {
      // array change
      case 'A': {
        let path = el.path.concat([el.index])
        state = mori.assocIn(state, path, mori.toClj(el.rhs))
      }
        break

      // new element
      case 'N':
      // edited element
      case 'E': {
        state = mori.assocIn(state, el.path, mori.toClj(el.rhs))
      }
        break

      // deleted element
      case 'D': {
        let path = el.path
        let key = path.pop()
        if (path.length > 0) {
          state = mori.updateIn(state, path, (x) => mori.dissoc(x, key))
        } else {
          state = mori.dissoc(state, key)
        }
      }
        break
    }
  }

  return state
}

patch.applyAt = (state, path, diff) => {
  let initial = mori.getIn(state, path)
  let patched = patch(initial, diff)
  return mori.assocIn(state, path, patched)
}

module.exports = patch
