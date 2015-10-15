import test from 'zopf'
import sniff from '../app/util/sniff'

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

  for (let [file, expected_type] of types) {
    t.case(file, t => {
      return sniff.path(`${__dirname}/fixtures/${file}`).then((type) => {
        t.is(type, expected_type)
      })
    })
  }
})
