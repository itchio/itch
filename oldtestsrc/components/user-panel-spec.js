
import test from 'zopf'
import sd from './skin-deeper'

import UserPanel from '../../app/components/user-panel'

test('user-panel', t => {
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
