
let sd = require('skin-deep')
let react = require('react')

/**
* Pretty much unnecessary now
*/
let self = (comp, opts, children) => {
  if (typeof opts === 'undefined') {
    opts = {}
  }

  return react.createElement(comp, opts, children)
}

Object.assign(self, sd)

module.exports = self
