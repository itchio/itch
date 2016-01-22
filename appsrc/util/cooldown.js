
let self = function (ms_between_requests) {
  let last_request = 0

  return function cooldown () {
    // TODO use babel-plugin-contracts
    let now = Date.now()
    let next_acceptable = last_request + ms_between_requests
    let quiet = next_acceptable - now

    if (now > next_acceptable) {
      last_request = now
      return Promise.resolve()
    } else {
      last_request = next_acceptable
    }

    return new Promise((resolve, reject) => {
      setTimeout(resolve, quiet)
    })
  }
}

module.exports = self
