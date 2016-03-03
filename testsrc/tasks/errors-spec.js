
import test from 'zopf'
import {Transition, InputRequired} from '../../app/tasks/errors'

test('task errors', t => {
  t.throws(() => {
    throw new Transition({to: 'somewhere', reason: 'testing'})
  }, Transition, 'Transition')

  t.is('Transition(to a because b)', new Transition({to: 'a', reason: 'b'}).toString(), 'Transition.toString')
  t.throws(() => {
    throw new InputRequired({})
  }, InputRequired, 'InputRequired')
})
