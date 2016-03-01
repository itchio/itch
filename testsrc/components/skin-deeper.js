
import sd from 'skin-deep'
import react from 'react'

/**
* Pretty much unnecessary now
*/
const self = (comp, opts, children) => {
  if (typeof opts === 'undefined') {
    opts = {}
  }

  return react.createElement(comp, opts, children)
}

self.as_array = (arr) => Array.isArray(arr) ? arr : [arr]

Object.assign(self, sd)

export default self
