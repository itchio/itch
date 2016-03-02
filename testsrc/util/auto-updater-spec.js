
import test from 'zopf'
import proxyquire from 'proxyquire'

const setup = (t, platform) => {
  const os = test.module({
    platform: () => platform
  })

  const stubs = {
    './os': os
  }
  const updater = proxyquire('../../app/util/auto-updater', stubs).default

  return {os, updater}
}

const setup_win32 = t => {
  const os = test.module({
    platform: () => 'win32',
    cli_args: () => []
  })

  const reg = test.module({
    install: async () => null,
    update: async () => null,
    uninstall: async () => null
  })

  const shortcut = test.module({
    install: async () => null,
    update: async () => null,
    uninstall: async () => null
  })

  const stubs = {
    '../os': os,
    '../reg': reg,
    '../shortcut': shortcut
  }

  const win32 = proxyquire('../../app/util/auto-updater/win32', stubs).default
  return {os, win32}
}

test('auto-updater', t => {
  t.case('stubbed on darwin', async t => {
    const r = setup(t, 'darwin')
    t.false(await r.updater.start(), 'returns false')
  })

  t.case('bypassed on linux', async t => {
    const r = setup(t, 'linux')
    t.false(await r.updater.start(), 'returns false')
  })
})

test('auto-updater/win32', t => {
  t.case(`noop if no squirrel command`, async t => {
    const r = setup(t, 'win32')
    t.false(await r.updater.start(), 'returns false')
  })

  ;['install', 'updated', 'uninstall', 'obsolete'].forEach((action) => {
    t.case(`quit on ${action}`, async t => {
      const r = setup_win32(t)
      t.stub(r.os, 'cli_args').returns(['hi mom', `--squirrel-${action}`])
      t.true(await r.win32.start(), 'returns true')
    })
  })
})
