
import test from 'zopf'

import fixture from '../fixture'
import {each} from 'underline'

import html from '../../app/tasks/configure/html'

test('html-configure', (t) => {
  const cases = [
    { desc: 'nested index.html', path: 'configure/html/nested', expects: 'ThisContainsStuff/index.html' },
    { desc: 'many html files', path: 'configure/html/many', expects: 'index.html' }
  ]

  cases::each((caseDef) => {
    const htmlPath = fixture.path(caseDef.path)

    t.case(`picks correct .html entry point (${caseDef.desc})`, async function (t) {
      const res = await html.getGamePath(htmlPath)
      t.same(res, caseDef.expects)
    })
  })
})
