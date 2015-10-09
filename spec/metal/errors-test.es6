import test from 'tape'
import {Transition, Deadend, InputRequired} from '../../metal/tasks/errors'

test('can build and throw three types of special errors', t => {
  t.plan(3)
  t.throws(() => {
    throw new Transition({to: 'somewhere', reason: 'testing'})
  }, Transition)
  t.throws(() => {
    throw new Deadend({reason: 'testing'})
  }, Deadend)
  t.throws(() => {
    throw new InputRequired({})
  }, InputRequired)
})
