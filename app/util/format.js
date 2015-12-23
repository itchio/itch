'use strict'

let self = {
  camelize: function (str) {
    return str.replace(/(?:_[a-z])/g, function (letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    }).replace(/_+/g, '')
  },

  camelizeAll: function (str) {
    return str.replace(/(?:_[a-z]|^[a-z])/g, function (letter, index) {
      return letter.toUpperCase()
    }).replace(/_+/g, '')
  }
}

module.exports = self
