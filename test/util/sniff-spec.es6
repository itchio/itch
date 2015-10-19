import test from 'zopf'
import sinon from 'sinon'

import fixture from '../fixture'
import sniff from '../../app/util/sniff'

test('sniff', t => {
  let types = [
    ['broken-symlink', false],
    ['empty', false],
    ['txt', false],
    ['elf', 'elf executable'],
    ['mach-o', 'mach-o executable'],
    ['mach-o-bis', 'mach-o executable'],
    ['mach-o-universal', 'mach-o universal binary'],
    ['sh', 'shell script']
  ]

  types.forEach(([file, expected_type]) => {
    t.case(file, t => {
      let spy = t.spy()
      return sniff.path(fixture.path(file)).then(spy).then(res => {
        sinon.assert.calledWith(spy, expected_type)
      })
    })
  })

  t.case('is_tar', t => {
    t.true(sniff.is_tar(fixture.path('tar')))
  })
})
