import fs from 'fs'
import Immutable from 'seamless-immutable'

let self = {
  json: function (path) {
    return JSON.parse(fs.readFileSync(`${__dirname}/fixtures/${path}.json`))
  },

  api: function (path) {
    return Immutable(self.json(`api/${path}`))
  }
}

export default self
