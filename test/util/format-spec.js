'use nodent';'use strict'
import test from 'zopf'

import format from '../../app/util/format'

test('format', t => {
  t.case('camelize', t => {
    t.same(format.camelize('find'), 'find')
    t.same(format.camelize('load_database'), 'loadDatabase')
    t.same(format.camelize('a_bc_de_fg'), 'aBcDeFg')
  })
})
