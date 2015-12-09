import test from 'zopf'

import fixture from '../fixture'
import sniff from '../../app/util/sniff'

test('sniff', t => {
  let types = [
    ['broken-symlink', null],
    ['empty', null],
    ['txt', null],
    ['elf', 'application/octet-stream'],
    ['mach-o', 'application/octet-stream'],
    ['mach-o-bis', 'application/octet-stream'],
    ['mach-o-universal', 'application/octet-stream'],
    ['sh', 'application/x-sh'],
    ['tar', 'application/x-tar']
  ]

  types.forEach(([file, expected_type]) => {
    t.case(file, async t => {
      let res = await sniff.path(fixture.path(file))
      let type = (res && res.mime) || null
      if (expected_type !== type) {
        throw new Error(`expected type ${expected_type}, got ${type}`)
      }
    })
  })
})
