import test from 'zopf'

import format from '../app/util/format'

test('format', t => {
  t.case('format_bytes', t => {
    t.same(format.format_bytes(897), '897 bytes')
    t.same(format.format_bytes(12498), '12 kB')
    t.same(format.format_bytes(4249830), '4 MB')
  })

  t.case('camelize', t => {
    t.same(format.camelize('find'), 'find')
    t.same(format.camelize('load_database'), 'loadDatabase')
    t.same(format.camelize('a_bc_de_fg'), 'aBcDeFg')
  })
})
