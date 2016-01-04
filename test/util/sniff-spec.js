
let test = require('zopf')
let assert = require('assert')

let fixture = require('../fixture')
let sniff = require('../../app/util/sniff')

test('sniff', t => {
  let types = [
    ['broken-symlink', null],
    ['empty', null],
    ['txt', null],
    ['elf', {ext: '', mime: 'application/octet-stream', executable: true}],
    ['mach-o', {ext: '', mime: 'application/octet-stream', executable: true}],
    ['mach-o-bis', {ext: '', mime: 'application/octet-stream', executable: true}],
    ['mach-o-universal', {ext: '', mime: 'application/octet-stream', executable: true}],
    ['sh', {ext: 'sh', mime: 'application/x-sh', executable: true}],
    ['tar', {ext: 'tar', mime: 'application/x-tar'}],
    ['fallback.tar', {ext: 'tar', mime: null}],
    ['dmg', {ext: 'dmg', mime: 'application/x-apple-diskimage'}],
    ['dmg-bz2', {ext: 'dmg', mime: 'application/x-apple-diskimage'}],
    ['dmg-gz', {ext: 'dmg', mime: 'application/x-apple-diskimage'}]
  ]

  types.forEach((pair) => {
    let file = pair[0]
    let expected = pair[1]
    t.case(file, async t => {
      let res = await sniff.path(fixture.path(file))
      assert.deepEqual(res, expected)
    })
  })
})
