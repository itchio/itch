'use nodent';'use strict'

import common from './common'

let self = {
  configure: async function (app_path) {
    let executables = await common.fix_execs(app_path)
    return {executables}
  }
}

export default self
