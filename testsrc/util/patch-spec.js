let test = require('zopf')
let mori = require('mori')
let clone = require('clone')
let deep = require('deep-diff')

import {indexBy} from 'underline'

let patch = require('../../app/util/patch')

test('patch', t => {
  let state = [ {id: 42}, {id: 21}, {id: 8} ]::indexBy('id')
  let saved_state = {}
  let mori_state = mori.hashMap()

  let send_diff = (label) => {
    let diff = deep.diff(saved_state, state)
    saved_state = clone(state)
    mori_state = patch(mori_state, diff)
    t.same(mori.toJs(mori_state), state, label)
  }

  send_diff('initial')

  state['42'].name = 'Hi!'
  send_diff('add field')

  state['42'].name = 'Bye!'
  send_diff('change field')

  delete state['42'].name
  send_diff('delete field')

  delete state['21']
  send_diff('delete record')
})
