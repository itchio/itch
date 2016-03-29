
import Promise from 'bluebird'

export const delay = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms))
