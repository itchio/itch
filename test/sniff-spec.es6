import test from 'zopf'
import sniff from '../app/util/sniff'
import Promise from 'bluebird'

test('sniff', t => {
  let types = [
    ['empty', false],
    ['txt', false],
    ['elf', 'elf executable'],
    ['mach-o', 'mach-o executable'],
    ['mach-o-bis', 'mach-o executable'],
    ['mach-o-universal', 'mach-o universal binary'],
    ['sh', 'shell script']
  ]
  return Promise.map(types, ([file, expected_type]) => {
    return sniff.path(`${__dirname}/fixtures/${file}`).then((type) => {
      t.is(type, expected_type, file)
    })
  })
})
