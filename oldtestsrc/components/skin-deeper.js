
import sd from 'skin-deep'
import react from 'react'

export const store = {
  getState: () => {},
  dispatch: (action) => {},
  subscribe: () => null
}

/**
 * Pretty much unnecessary now
 */
const self = (comp, opts, children) => {
  if (typeof opts === 'undefined') {
    opts = {}
  }

  opts = {...opts, store}

  return react.createElement(comp, opts, children)
}

self.asArray = (arr) => Array.isArray(arr) ? arr : [arr]

Object.assign(self, sd)

export default self
