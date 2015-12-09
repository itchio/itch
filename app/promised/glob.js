'use nodent';'use strict'

import Promise from 'bluebird'

let glob = Promise.promisify(require('glob'))

export default glob
