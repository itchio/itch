
import test from 'zopf'

import format from '../../app/util/format'

test('format', t => {
  t.case('slugify', t => {
    t.same(format.slugify(`I'm all yours`), 'im_all_yours')
    t.same(format.slugify('Rings & things and buttons & Bows'), 'rings_things_and_buttons_bows')
  })

  t.case('camelify', t => {
    t.same(format.camelify('can_be_bought'), 'canBeBought')
  })

  t.case('camelifyObject', t => {
    t.same(format.camelifyObject({
      game: {
        in_press_system: true,
        user: {
          cover_url: ''
        }
      }
    }), {
      game: {
        inPressSystem: true,
        user: {
          coverUrl: ''
        }
      }
    })
  })
})
