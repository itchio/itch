
import test from 'zopf'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import cooldown from '../stubs/cooldown'
import path from 'path'

import AppConstants from '../../app/constants/app-constants'
import AppDispatcher from '../../app/dispatcher/app-dispatcher'
import AppActions from '../../app/actions/app-actions'

import i18next from 'i18next'

test('i18next backend', t => {
  let app = {
    getPath: () => 'userdata'
  }

  let log = () => null
  log.Logger = function () {}

  let ifs = {
    exists: async () => false,
    read_file: async (path) => {
      if (/^userdata/.test(path)) {
        return '{"a": "c"}'
      } else {
        return '{"a": "b"}'
      }
    },
    write_file: async () => null,
    '@noCallThru': true
  }

  let needle = {
    requestAsync: async () => ({statusCode: 418}),
    '@noCallThru': true
  }

  let env = {
    name: 'production',
    '@noCallThru': true
  }

  let stubs = Object.assign({}, {
    './ifs': ifs,
    '../util/app': app,
    '../util/log': () => log,
    '../util/cooldown': cooldown,
    '../promised/needle': needle,
    '../env': env
  })
  let Backend = proxyquire('../../app/i18next/backend', stubs)
  let backend, handler

  t.case('registers as listener', t => {
    let mock = t.mock(AppDispatcher).expects('register')
    backend = new Backend({}, {loadPath: 'locales'})
    handler = mock.getCall(0).args[1]
  })

  t.case('responds to download request', t => {
    t.mock(backend).expects('queue_download')
    handler({action_type: AppConstants.LOCALE_UPDATE_QUEUE_DOWNLOAD, lang: 'fr'})
  })

  t.case('responds to resource fetching', t => {
    t.mock(i18next).expects('addResources')
    handler({action_type: AppConstants.LOCALE_UPDATE_DOWNLOADED, lang: 'zh', resources: {}})
  })

  t.case('fails if no files exist', async t => {
    let spy = t.spy()
    await backend.read('fr_CH', 'language', spy)
    sinon.assert.calledWith(spy, null, {})
  })

  t.case('succeeds if long file exists', async t => {
    let exists = t.stub(ifs, 'exists')
    exists.resolves(false)
    exists.withArgs(path.join('locales', 'fr_CH.json')).resolves(true)

    let spy = t.spy()
    await backend.read('fr_CH', 'language', spy)
    sinon.assert.calledWith(spy, null, {a: 'b'})
  })

  t.case('succeeds if short file exists', async t => {
    let exists = t.stub(ifs, 'exists')
    exists.resolves(false)
    exists.withArgs(path.join('locales', 'fr.json')).resolves(true)

    let spy = t.spy()
    await backend.read('fr_CH', 'language', spy)
    sinon.assert.calledWith(spy, null, {a: 'b'})
  })

  t.case(`returns empty resources if we can't parse local files`, async t => {
    let exists = t.stub(ifs, 'exists')
    exists.resolves(false)
    exists.withArgs(path.join('locales', 'fr.json')).resolves(true)

    t.stub(ifs, 'read_file').resolves('not even json')

    let spy = t.spy()
    await backend.read('fr_CH', 'language', spy)
    sinon.assert.calledWith(spy, null, {})
  })

  t.case('uses updated locale file if available', async t => {
    let exists = t.stub(ifs, 'exists')
    exists.resolves(false)
    exists.withArgs(path.join('locales', 'fr.json')).resolves(true)
    exists.withArgs(path.join('userdata', 'locales', 'fr_CH.json')).resolves(true)

    let read_file = t.spy(ifs, 'read_file')

    let spy = t.spy()
    await backend.read('fr_CH', 'language', spy)
    sinon.assert.calledWith(spy, null, {a: 'c'})
    sinon.assert.calledWith(read_file, path.join('locales', 'fr.json'))
    sinon.assert.calledWith(read_file, path.join('userdata', 'locales', 'fr_CH.json'))
  })

  t.case('grabs & saves remote locale when available', async t => {
    let start = t.spy(AppActions, 'locale_update_download_start')
    let end = t.spy(AppActions, 'locale_update_download_end')

    let exists = t.stub(ifs, 'exists')
    exists.resolves(false)
    exists.withArgs(path.join('locales', 'fr.json')).resolves(true)

    t.stub(needle, 'requestAsync').resolves({statusCode: 200, body: {a: 'c'}})
    t.mock(ifs).expects('write_file').resolves()

    let spy = t.spy()
    await backend.read('fr_CH', 'language', spy)

    sinon.assert.calledOnce(start)
    sinon.assert.calledOnce(end)
  })
})
