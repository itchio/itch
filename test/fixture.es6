import fs from 'fs'
import path from 'path'
import Immutable from 'seamless-immutable'

let self = {
  path: function (spec) {
    return path.resolve(`${__dirname}/fixtures/files/${spec}`)
  },

  json: function (spec) {
    return JSON.parse(fs.readFileSync(`${__dirname}/fixtures/${spec}.json`))
  },

  api: function (spec) {
    return Immutable(self.json(`api/${spec}`))
  }
}

export default self
