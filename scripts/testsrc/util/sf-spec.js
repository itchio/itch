
import ospath from 'path'
import test from 'zopf'
import tmp from 'tmp'
import fixture from '../fixture'

import {EventEmitter} from 'events'

import sf from '../../app/util/sf'

test('sf', t => {
  t.case('sf.exists', async t => {
    t.true(await sf.exists(fixture.path('empty')))
    t.false(await sf.exists(fixture.path('a-classic-cake-song')))
  })

  t.case('sf.readFile', async t => {
    t.same(await sf.readFile(fixture.path('txt')), 'Hello there, just writing a bit of text for the sniffer specs\n')
  })

  t.case('sf.writeFile', async t => {
    const contents = 'What is head may never dye'
    let readContents
    let err
    const tmpObj = tmp.fileSync()

    try {
      await sf.writeFile(tmpObj.name, contents)
      readContents = await sf.readFile(tmpObj.name)
    } catch (e) {
      err = e
    } finally {
      tmpObj.removeCallback()
    }

    if (err) {
      throw err
    }
    t.same(readContents, contents)
  })

  t.case('sf.appendFile', async t => {
    const contentsA = 'What is head'
    const contentsB = ' may never dye'
    let readContents
    let err
    const tmpObj = tmp.fileSync()

    try {
      await sf.writeFile(tmpObj.name, contentsA)
      await sf.appendFile(tmpObj.name, contentsB)
      readContents = await sf.readFile(tmpObj.name)
    } catch (e) {
      err = e
    } finally {
      tmpObj.removeCallback()
    }

    if (err) {
      throw err
    }
    t.same(readContents, contentsA + contentsB)
  })

  t.case('sf.wipe', async t => {
    let err
    const tmpObj = tmp.dirSync()

    const touch = async function (name) {
      const path = ospath.join(tmpObj.name, name)
      await sf.writeFile(path, name)
    }

    try {
      await touch('hello.txt')
      await touch('super/deep/hello.txt')
      await touch('super/deep/hella.txt')
      await touch('super/cavernous/and/deep/into/the/temple/of/no.txt')
      await sf.wipe(tmpObj.name)
    } catch (e) {
      err = e
    }

    if (err) {
      throw err
    }
    t.false(await sf.exists(tmpObj.name))
  })

  t.case('sf.promised (resolve 1)', async t => {
    const stream = new EventEmitter()
    const p = sf.promised(stream)
    setTimeout(() => stream.emit('close'), 0)
    await p
  })

  t.case('sf.promised (resolve 2)', async t => {
    const stream = new EventEmitter()
    const p = sf.promised(stream)
    setTimeout(() => stream.emit('end'), 0)
    await p
  })

  t.case('sf.promised (rejects)', async t => {
    const stream = new EventEmitter()
    const p = sf.promised(stream)
    setTimeout(() => stream.emit('error'), 0)
    await t.rejects(p)
  })
})
