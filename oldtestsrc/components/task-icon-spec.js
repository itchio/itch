
import test from 'zopf'
import sd from './skin-deeper'

import TaskIcon from '../../app/components/task-icon'

test('TaskIcon', t => {
  const task = 'find-upload'
  const tree = sd.shallowRender(sd(TaskIcon, {task}))
  let Icon
  t.ok(Icon = tree.findNode('Icon'))
  t.is(Icon.props.icon, 'stopwatch')
})
