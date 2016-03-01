
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('ErrorList', t => {
  const ErrorList = proxyquire('../../app/components/error-list', stubs).default
  sd.shallowRender(sd(ErrorList, {errors: null}))
  sd.shallowRender(sd(ErrorList, {errors: 'uh oh'}))
  sd.shallowRender(sd(ErrorList, {errors: ['eenie', 'meenie']}))
})
