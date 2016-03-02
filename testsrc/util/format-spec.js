
import test from 'zopf'

import format from '../../app/util/format'

test('format', t => {
  t.case('slugify', t => {
    t.same(format.slugify(`I'm all yours`), 'im_all_yours')
    t.same(format.slugify('Rings & things and buttons & Bows'), 'rings_things_and_buttons_bows')
  })
})
