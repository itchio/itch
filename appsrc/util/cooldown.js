
let self = function (ms_between_requests) {
  pre: { // eslint-disable-line
    typeof ms_between_requests === 'number'
    ms_between_requests > 0
  }
  let last_request = 0

  return function cooldown () {
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

export default self
