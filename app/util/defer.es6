
if (process.type === 'renderer') {
  module.exports = function (f) { setTimeout(f, 0) }
} else {
  module.exports = function (f) { setImmediate(f) }
}
