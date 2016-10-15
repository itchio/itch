
let store

if (process.type) {
  store = require(`./${process.type}-store`)
} else {
  store = require('./mock-store')
}

export = store
