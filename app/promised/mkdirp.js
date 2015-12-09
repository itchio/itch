'use nodent';'use strict'
import Promise from 'bluebird'
import mkdirp from 'mkdirp'

export default Promise.promisify(mkdirp)
