
if (process.type) {
  module.exports = require(`./${process.type}-store`)
} else {
  module.exports = require('./mock-store')
}
