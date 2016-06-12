
import Promise from 'bluebird'
import sudo from 'electron-sudo'

module.exports = Promise.promisifyAll(sudo)
