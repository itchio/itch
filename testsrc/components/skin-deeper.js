
const sd = require('skin-deep')
const react = require('react')

/**
* Pretty much unnecessary now
*/
let self = (comp, opts, children) => {
  if (typeof opts === 'undefined') {
    opts = {}
  }

  return react.createElement(comp, opts, children)
}

self.as_array = (arr) => Array.isArray(arr) ? arr : [arr]

Object.assign(self, sd)

module.exports = self
