
const test = require('zopf')

const format = require('../../app/util/format')

test('format', t => {
  t.case('camelize', t => {
    t.same(format.camelize('find'), 'find')
    t.same(format.camelize('load_database'), 'loadDatabase')
    t.same(format.camelize('a_bc_de_fg'), 'aBcDeFg')
  })

  t.case('slugify', t => {
    t.same(format.slugify(`I'm all yours`), 'im_all_yours')
    t.same(format.slugify('Rings & things and buttons & Bows'), 'rings_things_and_buttons_bows')
  })
})
