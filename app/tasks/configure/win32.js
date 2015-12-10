'use strict'

let glob = require('../../promised/glob')

let self = {
  configure: async function (app_path) {
    let executables = await glob(`${app_path}/**/*.@(exe|bat)`)
    return {executables}
  }
}

module.exports = self
