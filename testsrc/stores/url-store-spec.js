
import test from 'zopf'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

import AppConstants from '../../app/constants/app-constants'

import I18nStore from '../stubs/i18n-store'
import AppActions from '../stubs/app-actions'
import AppDispatcher from '../stubs/app-dispatcher'
import market from '../stubs/market'
import electron from '../stubs/electron'
import url_parser from 'url'

test('UrlStore', t => {
  const os = test.module({
    itch_platform: () => 'osx'
  })

  const CaveStore = test.module({
    find_for_game: () => null
  })

  const stubs = Object.assign({
    'url': url_parser,
    './i18n-store': I18nStore,
    './cave-store': CaveStore,
    '../util/os': os,
    '../util/market': market,
    '../dispatcher/app-dispatcher': AppDispatcher,
    '../actions/app-actions': AppActions
  }, electron)

  proxyquire('../../app/stores/url-store', stubs)
  const handler = AppDispatcher.get_handler('url-store')

  t.case('ignore invalid URLs', async t => {
    await handler({action_type: AppConstants.OPEN_URL, url: 'itchio://test/invalid'})
    await handler({action_type: AppConstants.OPEN_URL, url: 'itchio://install'})
    await handler({action_type: AppConstants.OPEN_URL, url: 'itchio://launch'})
  })

  t.case('store queues if not rolling, handles if rolling', t => {
    const mock = t.mock(url_parser)
    const ret = {hostname: 'test', pathname: 'test/test'}

    mock.expects('parse').withArgs('itchio://test/before').returns(ret)
    handler({action_type: AppConstants.OPEN_URL, url: 'itchio://test/before'})
    handler({action_type: AppConstants.READY_TO_ROLL})

    mock.expects('parse').withArgs('itchio://test/after').returns(ret)
    handler({action_type: AppConstants.OPEN_URL, url: 'itchio://test/after'})
  })

  t.case('install tries to install game', async t => {
    const bag = {
      games: {
        '1234': {id: 1234, user_id: 42, p_osx: true}
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.stub(electron.electron.dialog, 'showMessageBox').callsArgWith(1, 0)
    t.mock(AppActions).expects('queue_game')
    await handler({action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234'})
  })

  t.case('install apologizes if game is not compatible', async t => {
    const bag = {
      games: {
        '1234': {id: 1234, user_id: 42, p_osx: false}
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.mock(electron.electron.dialog).expects('showMessageBox').withArgs(sinon.match.has('title', 'prompt.no_compatible_version.title'))

    await handler({action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234'})
  })

  t.case('install focuses on game if already installed', async t => {
    const bag = {
      games: {
        '1234': {id: 1234, user_id: 42, p_osx: true}
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.stub(CaveStore.default, 'find_for_game').returns({id: 'hello'})
    t.mock(AppActions).expects('focus_panel').withArgs('caves/hello')

    await handler({action_type: AppConstants.OPEN_URL, url: 'itchio://install/1234'})
  })

  t.case('launch tries to install when not installed yet', async t => {
    const bag = {
      games: {
        '1234': {id: 1234, user_id: 42, p_osx: true}
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])
    t.stub(CaveStore.default, 'find_for_game').returns(null)
    t.mock(electron.electron.dialog).expects('showMessageBox').withArgs(sinon.match.has('title', 'prompt.url_install.title'))

    await handler({action_type: AppConstants.OPEN_URL, url: 'itchio://launch/1234'})
  })

  t.case('launch tries to launch when installed', async t => {
    const bag = {
      games: {
        '1234': {id: 1234, user_id: 42, p_osx: true}
      },
      users: {
        '42': {}
      }
    }
    t.stub(market, 'get_entities', (x) => bag[x])

    t.stub(CaveStore.default, 'find_for_game').returns({id: 'hello'})
    t.mock(AppActions).expects('queue_game')

    await handler({action_type: AppConstants.OPEN_URL, url: 'itchio://launch/1234'})
  })
})
