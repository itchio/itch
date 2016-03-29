
import Promise from 'bluebird'

let self = function (msBetweenRequests) {
  pre: { // eslint-disable-line
    typeof msBetweenRequests === 'number'
    msBetweenRequests > 0
  }
  let lastRequest = 0

  return function cooldown () {
    let now = Date.now()
    let nextAcceptable = lastRequest + msBetweenRequests
    let quiet = nextAcceptable - now

    if (now > nextAcceptable) {
      lastRequest = now
      return Promise.resolve()
    } else {
      lastRequest = nextAcceptable
    }

    return new Promise((resolve, reject) => {
      setTimeout(resolve, quiet)
    })
  }
}

export default self
