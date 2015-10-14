
import ExtendableError from 'es6-error'

class Transition extends ExtendableError {
  constructor (opts) {
    super('task transition')
    this.to = opts.to
    this.reason = opts.reason
  }

  toString () {
    return `Transition(to ${this.to} because ${this.reason})`
  }
}

class InputRequired extends ExtendableError {
  constructor (opts) {
    super('user interaction required')
  }
}

export { Transition, InputRequired }
