'use nodent';'use strict'

let self = {
  camelize: function (str) {
    return str.replace(/(?:_[a-z])/g, function (letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    }).replace(/_+/g, '')
  }
}

export default self
