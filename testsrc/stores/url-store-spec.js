
const test = require('zopf')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const AppConstants = require('../../app/constants/app-constants')

const I18nStore = require('../stubs/i18n-store')
const AppActions = require('../stubs/app-actions')
const AppDispatcher = require('../stubs/app-dispatcher')
const market = require('../stubs/market')
const electron = require('../stubs/electron')
const url_parser = require('url')

test('UrlStore', t => {
  let os = {
    itch_platform: () => 'osx'
  }

  let CaveStore = {
    find_for_game: () => null,
    '@noCallThru': true
  }

  let stubs = Object.assign({
    'url': url_parser,
    './i18n-store': I18nStore,
    './cave-store': CaveStore,
    '../util/os': os,
    '../util/market': market,
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
    let bag = {
      games: {
        '1234': { id: 1234, user_id: 42, p_osx: true }
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.stub(electron.electron.dialog, 'showMessageBox').callsArgWith(1, 0)
    t.mock(AppActions).expects('queue_game')
    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234' })
  })

  t.case('install tries to fetch info about game, then install', async t => {
    let bag = {
      games: {},
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])
    t.mock(AppActions).expects('fetch_games')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234' })

    t.mock(electron.electron.dialog).expects('showMessageBox').withArgs(sinon.match.has('title', 'prompt.url_install.title'))
    bag.games['1234'] = { id: 1234, user_id: 42, p_osx: true }
    await handler({ action_type: AppConstants.GAMES_FETCHED, game_ids: [5124, 12379, 1234, 4] })
  })

  t.case('install apologizes if game is not compatible', async t => {
    let bag = {
      games: {
        '1234': { id: 1234, user_id: 42, p_osx: false }
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.mock(electron.electron.dialog).expects('showMessageBox').withArgs(sinon.match.has('title', 'prompt.no_compatible_version.title'))

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234' })
  })

  t.case('install focuses on game if already installed', async t => {
    let bag = {
      games: {
        '1234': { id: 1234, user_id: 42, p_osx: true }
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.stub(CaveStore, 'find_for_game').returns({id: 'hello'})
    t.mock(AppActions).expects('focus_panel').withArgs('caves/hello')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234' })
  })

  t.case('launch tries to install when not installed yet', async t => {
    let bag = {
      games: {
        '1234': { id: 1234, user_id: 42, p_osx: true }
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])
    t.stub(CaveStore, 'find_for_game').returns(null)
    t.mock(electron.electron.dialog).expects('showMessageBox').withArgs(sinon.match.has('title', 'prompt.url_install.title'))

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://launch/1234' })
  })

  t.case('launch tries to install when not even in db', async t => {
    t.stub(market, 'get_entities').returns({})
    t.stub(CaveStore, 'find_for_game').returns(null)
    t.mock(AppActions).expects('fetch_games').withArgs('games/1234')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://launch/1234' })
  })

  t.case('launch tries to launch when installed', async t => {
    let bag = {
      games: {
        '1234': { id: 1234, user_id: 42, p_osx: true }
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.stub(CaveStore, 'find_for_game').returns({id: 'hello'})
    t.mock(AppActions).expects('queue_game')

    await handler({ action_type: AppConstants.OPEN_URL, url: 'itchio://launch/1234' })
  })
})
