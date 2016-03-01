
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('ProgressBar', t => {
  const ProgressBar = proxyquire('../../app/components/progress-bar', stubs).default
  sd.shallowRender(sd(ProgressBar, {}))
  let progress = 0.5
  let tree = sd.shallowRender(sd(ProgressBar, {progress}))
  let inner = tree.findNode('.progress_inner')
  t.is(inner.props.style.width, '50%')
})
