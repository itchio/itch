import ExtendableError from 'es6-error'

class Transition extends ExtendableError {
  constructor (opts) {
    super('task transition')
    Object.assign(this, opts)
  }

  toString () {
    return `Transition(to ${this.to} because ${this.reason})`
  }
}

class InputRequired extends ExtendableError {
  constructor (opts) {
    super('user interaction required')
    Object.assign(this, opts)
  }
}

class Crash extends ExtendableError {
  constructor (opts) {
    super('application crashed')
    Object.assign(this, opts)
  }
}

export default { Transition, InputRequired, Crash }
