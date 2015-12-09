'use nodent';'use strict'

let self = function (msg) {
  return function (res) {
    console.log(`${msg}: ${JSON.stringify(res, null, 2)}`)
    return res
  }
}

export default self
