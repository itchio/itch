
const sf = require('../util/sf')
const fs = require('fs')

let self = {
  read_file: async function (file) {
    let p = new Promise((resolve, reject) => {
      fs.readFile(file, {encoding: 'utf8'}, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      })
    })
    return await p
  },

  // XXX we can't use fs.access via ASAR, it always returns false
  exists: async function (file) {
    try {
      await self.read_file(file)
    } catch (err) {
      return false
    }
    return true
  },

  write_file: sf.write_file
}

module.exports = self
