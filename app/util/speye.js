let self = function (msg) {
  return function (res) {
    console.log(`${msg}: ${JSON.stringify(res, null, 2)}`)
    return res
  }
}

module.exports = self
