
let ExtendableError = require('es6-error')

class Transition extends ExtendableError {
  constructor (opts) {
    super('task transition')
    Object.assign(this, opts, {type: 'transition'})
  }

  toString () {
    return `Transition(to ${this.to} because ${this.reason})`
  }
}

class InputRequired extends ExtendableError {
  constructor (opts) {
    super('user interaction required')
    Object.assign(this, opts, {type: 'input_required'})
  }
}

class Crash extends ExtendableError {
  constructor (opts) {
    super('application crashed')
    Object.assign(this, opts, {type: 'crash'})
  }
}

class Cancelled extends ExtendableError {
  constructor (opts) {
    super('cancelled')
    Object.assign(this, opts, {type: 'cancelled'})
  }
}

module.exports = { Transition, InputRequired, Crash, Cancelled }
