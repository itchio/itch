
import test from 'zopf'

import {getT} from '../app/localizer'

const strings = {
  en: {
    'foo': 'Foo!',
    'bar': 'Bar {{somekey}} bar.'
  }
}

test('localizer', t => {
  const _t = getT(strings, 'en')

  t.case('trivial', t => {
    t.same(_t('foo'), 'Foo!')
  })

  t.case('with variables', t => {
    t.same(_t('bar', {somekey: 'hello'}), 'Bar hello bar.')
  })
})
