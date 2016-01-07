
let Promise = require('bluebird')
let fs = require('../promised/fs')

/*
 * sf = backward fs, because fs itself is quite backwards
 */
let self = {
  /**
   * Returns true if file exists, false if ENOENT, throws if other error
   */
  exists: (file) => {
    return new Promise((resolve, reject) => {
      let callback = (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            resolve(false)
          } else {
            reject(err)
          }
        } else {
          resolve(true)
        }
      }

      fs.access(file, fs.R_OK, callback)
    })
  },

  /**
   * Return utf-8 file contents as string
   */
  read_file: async (file) => {
    return await fs.readFileAsync(file, {encoding: 'utf8'})
  },

  /**
   * Writes utf-8 string to file
   */
  write_file: async (file, contents) => {
    return await fs.writeFileAsync(file, contents)
  }
}

module.exports = self
