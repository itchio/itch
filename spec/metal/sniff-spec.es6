import test from 'zopf'
import sniff from '../../metal/util/sniff'

;[
  ['empty', false],
  ['txt', false],
  ['elf', 'elf executable'],
  ['mach-o', 'mach-o executable'],
  ['mach-o-bis', 'mach-o executable'],
  ['mach-o-universal', 'mach-o universal binary'],
  ['sh', 'shell script']
].forEach(([file, expected_type]) => {
  test(`should sniff ${file} correctly`, t => {
    return sniff.path(`${__dirname}/fixtures/${file}`).then((type) => {
      t.is(type, expected_type)
    })
  })
})
