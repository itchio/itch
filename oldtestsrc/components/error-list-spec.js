
import test from 'zopf'
import sd from './skin-deeper'

import ErrorList from '../../app/components/error-list'

test('ErrorList', t => {
  sd.shallowRender(sd(ErrorList, {errors: null}))
  sd.shallowRender(sd(ErrorList, {errors: 'uh oh'}))
  sd.shallowRender(sd(ErrorList, {errors: ['eenie', 'meenie']}))
})
