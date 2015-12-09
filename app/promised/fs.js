
import Promise from 'bluebird'

let fs = Promise.promisifyAll(require('fs'))

export default fs
