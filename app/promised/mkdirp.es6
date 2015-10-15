import Promise from 'bluebird'
import mkdirp from 'mkdirp'

export default Promise.promisify(mkdirp)
