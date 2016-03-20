
import test from 'zopf'
import sd from './skin-deeper'

import Icon from '../../app/components/icon'

test('Icon', t => {
  sd.shallowRender(sd(Icon, {}))
  const icon = 'boo'
  const tree = sd.shallowRender(sd(Icon, {icon}))
  t.ok(tree.findNode('.icon-boo'))
})
