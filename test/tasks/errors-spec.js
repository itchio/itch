'use nodent';'use strict'
let test = require('zopf')
let errors = require('../../app/tasks/errors')
let Transition = errors.Transition
let InputRequired = errors.Required

test('task errors', t => {
  t.throws(() => {
    throw new Transition({to: 'somewhere', reason: 'testing'})
  }, Transition, 'Transition')
  t.is('Transition(to a because b)', new Transition({to: 'a', reason: 'b'}).toString(), 'Transition.toString')
  t.throws(() => {
    throw new InputRequired({})
  }, InputRequired, 'InputRequired')
})
