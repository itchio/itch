
import test from 'zopf'

// synchronous defer, useful for testing stores
function defer (cb) {
  cb()
}

module.exports = test.module(defer)
