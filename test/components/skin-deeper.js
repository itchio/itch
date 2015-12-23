
let sd = require('skin-deep')
let react = require('react')

let t = (x) => x

/**
* Integrate skin-deep with react-i18next
*/
let self = (comp, opts, children) => {
  if (typeof opts === 'undefined') {
    opts = {}
  }
  opts.t = t

  return react.createElement(comp, opts, children)
}

Object.assign(self, sd)

module.exports = self
