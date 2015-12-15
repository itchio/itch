

let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')
let sd = require('skin-deep')

let electron = require('../stubs/electron')
let AppStore = require('../stubs/app-store')

let $ = require('react').createElement

test('library', t => {
  t.stub(electron.electron.remote, 'require').returns(AppStore)
  let library = proxyquire('../../app/components/library', electron)
  let LibraryPage = library.LibraryPage
  let LibrarySidebar = library.LibrarySidebar
  let LibraryContent = library.LibraryContent
  let LibraryPanelLink = library.LibraryPanelLink

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
        c: {task: 'download', progress: 0.2, game},
        d: {task: 'extract', progress: 0.7, game},
        e: {task: 'error', error: 'dun goofed', game},
        f: {task: 'idle', game}
      }
    }
    sd.shallowRender($(LibrarySidebar, {state: mori.toClj(props)}))
  })

  t.case('LibraryContent', t => {
    sd.shallowRender($(LibraryContent, {games: {}}))
  })

  t.case('LibraryPanelLink', t => {
    sd.shallowRender($(LibraryPanelLink, {}))
  })
})
