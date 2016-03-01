
let self = {
  camelize: function (str) {
    return str.replace(/(?:_[a-z])/g, function (letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    }).replace(/_+/g, '')
  },

  slugify: function (str) {
    return str.toLowerCase()
      .replace(/[^a-zA-Z_ ]/g, '')
      .replace(/ +/g, '_')
  }
}

export default self
