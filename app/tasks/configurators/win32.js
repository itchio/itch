'use nodent';'use strict'

import glob from '../../promised/glob'

let self = {
  configure: async function (app_path) {
    let executables = await glob(`${app_path}/**/*.@(exe|bat)`)
    return {executables}
  }
}

export default self
