import assign from 'object-assign'
import ExtendableError from 'es6-error'

class Transition extends ExtendableError {
  constructor (opts) {
    super('task transition')
    assign(this, opts)
  }

  toString () {
    return `Transition(to ${this.to} because ${this.reason})`
  }
}

class InputRequired extends ExtendableError {
  constructor (opts) {
    super('user interaction required')
    assign(this, opts)
  }
}

export default { Transition, InputRequired }
