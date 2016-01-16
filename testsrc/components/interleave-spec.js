
let test = require('zopf')
let interleave = require('../../app/components/interleave')

test('interleave', t => {
  let _t = (x, vars) => x

  t.same(interleave(_t, `Click me!`, {}), ['Click me!'], 'no var')
  t.same(interleave(_t, `Click [[exit]] to quit the app`, {exit: {a: 42}}), ['Click ', {a: 42}, ' to quit the app'], 'one var')
  t.same(interleave(_t, `[[b]] then [[a]]`, {a: {type: 'a'}, b: {type: 'b'}}), [{type: 'b'}, ' then ', {type: 'a'}], 'swapped vars')
  t.throws(() => {
    interleave(_t, `[[I accidentally a closing tag`)
  }, 'missing close')
})
