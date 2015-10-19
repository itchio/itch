import test from 'zopf'
import proxyquire from 'proxyquire'
import sd from 'skin-deep'

import electron from '../stubs/electron'
import AppStore from '../stubs/app-store'

let $ = require('react').createElement

test('library', t => {
  t.stub(electron.remote, 'require').returns(AppStore)
  let {LibraryPage, LibrarySidebar, LibraryContent,
    LibraryPanelLink} = proxyquire('../../app/components/library', electron)

  t.case('LibraryPage', t => {
    sd.shallowRender($(LibraryPage, {}))
  })

  t.case('LibrarySidebar', t => {
    let game = { title: 'Wreck IT' }
    let props = {
      collections: {
        a: {title: 'Collection A'},
        b: {title: 'Collection B'}
      },
      installs: {
        c: {state: 'ERROR', error: 'testing', game},
        d: {state: 'PENDING', game}
      }
    }
    sd.shallowRender($(LibrarySidebar, props))
  })

  t.case('LibraryContent', t => {
    sd.shallowRender($(LibraryContent, {games: {}}))
  })

  t.case('LibraryPanelLink', t => {
    sd.shallowRender($(LibraryPanelLink, {}))
  })
})
