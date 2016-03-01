
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('Icon', t => {
  const Icon = proxyquire('../../app/components/icon', stubs).default
  sd.shallowRender(sd(Icon, {}))
  const icon = 'boo'
  const tree = sd.shallowRender(sd(Icon, {icon}))
  t.ok(tree.findNode('.icon-boo'))
})
