
const self = {
  slugify: function (str) {
    return str.toLowerCase()
      .replace(/[^a-zA-Z_ ]/g, '')
      .replace(/ +/g, '_')
  }
}

export default self
