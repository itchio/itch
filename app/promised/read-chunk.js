'use nodent';'use strict'
import Promise from 'bluebird'
import read_chunk from 'read-chunk'

export default Promise.promisify(read_chunk)
