import test from 'tape'
import sniff from '../../metal/util/sniff'

let couples = [
  ['empty', false],
  ['txt', false],
  ['elf', 'elf executable'],
  ['mach-o', 'mach-o executable'],
  ['mach-o-bis', 'mach-o executable'],
  ['mach-o-universal', 'mach-o universal binary'],
  ['sh', 'shell script']
]

for (let [file, expected_type] of couples) {
  test(`should sniff ${file} correctly`, t => {
    return sniff.path(`${__dirname}/fixtures/${file}`).then((type) => {
      t.is(type, expected_type)
      t.end()
    })
  })
}
