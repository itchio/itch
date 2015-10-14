import test from 'zopf'
import {Transition, InputRequired} from '../app/tasks/errors'

test('can build and throw three types of special errors', t => {
  t.throws(() => {
    throw new Transition({to: 'somewhere', reason: 'testing'})
  }, Transition)
  t.throws(() => {
    throw new InputRequired({})
  }, InputRequired)
  t.is('Transition(to a because b)', new Transition({to: 'a', reason: 'b'}).toString())
})
