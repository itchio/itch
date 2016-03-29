
import test from 'zopf'

import {getT} from '../app/localizer'

const strings = {
  fr: {
    'bar': 'Café {{somekey}} pub.'
  },
  en: {
    'foo': 'Foo!',
    'bar': 'Bar {{somekey}} bar.'
  }
}

test('localizer', t => {
  const _t = getT(strings, 'en')
  const _frt = getT(strings, 'fr')

  t.case('trivial', t => {
    t.same(_t('foo'), 'Foo!')
  })

  t.case('with variables', t => {
    t.same(_t('bar', {somekey: 'hello'}), 'Bar hello bar.')
  })

  t.case('with defaultValue fallback', t => {
    t.same(_t('lapis', {somekey: 'hello', defaultValue: 'kinkos'}), 'kinkos')
  })

  t.case('with key fallback', t => {
    t.same(_t(['bar', 'foo'], {somekey: 'hello'}), 'Bar hello bar.')
    t.same(_t(['baz', 'bar'], {somekey: 'hello'}), 'Bar hello bar.')
  })

  t.case('with lang fallback', t => {
    t.same(_frt('bar', {somekey: 'salut'}), 'Café salut pub.')
    t.same(_frt('foo'), 'Foo!')
  })

  t.case('format', t => {
    t.same(_t.format('Park life'), 'Park life')
    t.same(_t.format(['bar', {somekey: 'hello'}]), 'Bar hello bar.')
  })
})
