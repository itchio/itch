
let test = require('zopf')
let proxyquire = require('proxyquire')
let sinon = require('sinon')

let AppConstants = require('../../app/constants/app-constants')

let I18nStore = require('../stubs/i18n-store')
let AppActions = require('../stubs/app-actions')
let AppDispatcher = require('../stubs/app-dispatcher')
let electron = require('../stubs/electron')
let db = require('../stubs/db')
let url_parser = require('url')

test('UrlStore', t => {
  let os = {
    itch_platform: () => 'osx'
  }

  let stubs = Object.assign({
    'url': url_parser,
    './i18n-store': I18nStore,
    '../util/os': os,
    '../util/db': db,
    '../dispatcher/app-dispatcher': AppDispatcher,
    '../actions/app-actions': AppActions
  }, electron)

  proxyquire('../../app/stores/url-store', stubs)
  let handler = AppDispatcher.get_handler('url-store')

  t.case('ignore invalid URLs', async t => {
    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://test/invalid' })
    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install' })
    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://launch' })
  })

  t.case('store queues if not rolling, handles if rolling', t => {
    let mock = t.mock(url_parser)
    let ret = {hostname: 'test', pathname: 'test/test'}

    mock.expects('parse').withArgs('itchio://test/before').returns(ret)
    handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://test/before' })
    handler({ action_type: AppConstants.READY_TO_ROLL })

    mock.expects('parse').withArgs('itchio://test/after').returns(ret)
    handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://test/after' })
  })

  t.case('install tries to install game', async t => {
    t.stub(db, 'find_game').resolves({p_osx: true})
    t.stub(db, 'find_user').resolves({})
    t.stub(electron.electron.dialog, 'showMessageBox').callsArgWith(1, 0)
    t.mock(AppActions).expects('queue_game')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234' })
  })

  t.case('install tries to fetch info about game, then install', async t => {
    let find_game = t.stub(db, 'find_game')
    find_game.resolves(null)
    t.mock(AppActions).expects('fetch_games')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234' })

    t.mock(electron.electron.dialog).expects('showMessageBox').withArgs(sinon.match.has('title', 'prompt.url_install.title'))
    find_game.resolves({p_osx: true})
    await handler({ action_type: AppConstants.GAMES_FETCHED, games: [5124, 12379, 1234, 4] })
  })

  t.case('install apologizes if game is not compatible', async t => {
    t.stub(db, 'find_game').resolves({p_osx: false, p_windows: true, p_linux: true})
    t.mock(electron.electron.dialog).expects('showMessageBox').withArgs(sinon.match.has('title', 'prompt.no_compatible_version.title'))

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234' })
  })

  t.case('install focuses on game if already installed', async t => {
    t.stub(db, 'find_game').resolves({p_osx: true})
    t.stub(db, 'find_cave_for_game').resolves({_id: 'hello'})
    t.mock(AppActions).expects('focus_panel').withArgs('caves/hello')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234' })
  })

  t.case('launch tries to install when not installed yet', async t => {
    t.stub(db, 'find_game').resolves({p_osx: true})
    t.stub(db, 'find_cave_for_game').resolves(null)
    t.mock(electron.electron.dialog).expects('showMessageBox').withArgs(sinon.match.has('title', 'prompt.url_install.title'))

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://launch/1234' })
  })

  t.case('launch tries to install when not even in db', async t => {
    t.stub(db, 'find_game').resolves(null)
    t.stub(db, 'find_cave_for_game').resolves(null)
    t.mock(AppActions).expects('fetch_games').withArgs('games/1234')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://launch/1234' })
  })

  t.case('launch tries to launch when installed', async t => {
    t.stub(db, 'find_game').resolves({p_osx: true})
    t.stub(db, 'find_cave_for_game').resolves({id: 'kalamazoo'})
    t.mock(AppActions).expects('queue_game')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://launch/1234' })
  })
})
