
import Promise from 'bluebird'

let glob = Promise.promisify(require('glob'))

export default glob
