
import test from 'zopf'
import sd from './skin-deeper'

import ProgressBar from '../../app/components/progress-bar'

test('ProgressBar', t => {
  sd.shallowRender(sd(ProgressBar, {}))
  let progress = 0.5
  let tree = sd.shallowRender(sd(ProgressBar, {progress}))
  let inner = tree.findNode('.progress_inner')
  t.is(inner.props.style.width, '50%')
})
