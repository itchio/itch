
import ExtendableError from 'es6-error'

class Transition extends ExtendableError {
  constructor (opts) {
    super('task transition')
    this.to = opts.to
    this.reason = opts.reason
  }
}

class Deadend extends ExtendableError {
  constructor (opts) {
    super('dead end')
    this.reason = opts.reason
  }
}

class InputRequired extends ExtendableError {
  constructor (opts) {
    super('user interaction required')
    throw new Error('InputRequired: stub!')
  }
}

export { Transition, Deadend, InputRequired }
