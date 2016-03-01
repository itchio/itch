
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('TaskIcon', t => {
  const TaskIcon = proxyquire('../../app/components/task-icon', stubs).default
  const task = 'find-upload'
  const tree = sd.shallowRender(sd(TaskIcon, {task}))
  let Icon
  t.ok(Icon = tree.findNode('Icon'))
  t.is(Icon.props.icon, 'stopwatch')
})
