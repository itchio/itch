
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('user-panel', t => {
  const UserPanel = proxyquire('../../app/components/user-panel', stubs).default

  t.case('UserPanel', t => {
    let state = {
      credentials: {
        me: {
          cover_url: 'https://example.org/img.png',
          username: 'toto'
        }
      }
    }

    sd.shallowRender(sd(UserPanel, {state}))
  })
})
