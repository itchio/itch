

let fs = require('fs')
let path = require('path')

let self = {
  path: function (spec) {
    return path.resolve(`${__dirname}/fixtures/files/${spec}`)
  },

  json: function (spec) {
    return JSON.parse(fs.readFileSync(`${__dirname}/fixtures/${spec}.json`))
  },

  api: function (spec) {
    return self.json(`api/${spec}`)
  }
}

module.exports = self
