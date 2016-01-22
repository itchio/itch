
let test = require('zopf')
let proxyquire = require('proxyquire')
import {pluck} from 'underline'

let electron = require('../stubs/electron')

test('db', t => {
  let stubs = electron
  let db = proxyquire('../../app/util/db', stubs)

  let noop = async () => undefined
  for (let m of ['insert', 'update', 'find', 'find_one', 'load_database', 'remove']) {
    db[m] = noop
  }

  t.case('is_date', t => {
    t.true(db.is_date('created_at'))
    t.false(db.is_date('user_id'))
  })

  t.case('to_date', t => {
    t.true(db.to_date('2013-12-12 16:47:35'), 'date')
    t.true(db.to_date('2013-12-12 16:47:35.23498'), 'date w/sub-second')
    t.throws(() => db.to_date('nine'), 'not a date')
  })

  t.case('dbify', t => {
    t.same(db.dbify('created_at', '2013-12-12 16:47:35'), new Date(Date.UTC(2013, 11, 12, 16, 47, 35)))
    t.is(db.dbify('user_id', 42), 42)
  })

  t.case('flatten', t => {
    let date = new Date()
    let obj = {
      a: {
        aa: { aaa: {}, aab: date },
        ab: 12
      },
      b: {
        ba: { baa: 'sheep' },
        bb: [1, 2, 3]
      },
      i: { like: 'trains' }
    }
    let fobj = {
      'a.aa.aab': date,
      'a.ab': 12,
      'b.ba.baa': 'sheep',
      'b.bb': [1, 2, 3],
      'i.like': 'trains'
    }
    t.same(db.flatten(obj), fobj)
  })

  t.case('merge_one', t => {
    let mock = t.mock(db)
    mock.expects('update').withArgs({_table: 'cookies', id: 19}, {$set: {'a.b': 1, 'b.a.c': 3}})
    db.merge_one({_table: 'cookies', id: 19}, {a: {b: 1}, b: {a: {c: 3}}})
  })

  t.case('load', async t => {
    let db2 = proxyquire('../../app/util/db', stubs)
    await db2.load(523980)
    t.ok(db2.find_one)
  })

  let make_eggs = (hens) => {
    if (typeof hens === 'undefined') {
      hens = false
    }
    return [1, 2, 3].map(x => {
      return {
        id: x,
        x,
        hen: {
          id: x * 2,
          y: x * 4
        }
      }
    })
  }
  let table = 'eggs'

  t.case('save_records (basic)', t => {
    let mock = t.mock(db)
    ;[1, 2, 3].forEach((x) => {
      mock.expects('update').withArgs(
        { _table: 'eggs', id: x },
        { $set: { _table: 'eggs', id: x, x } },
        { upsert: true }
      )
    })
    return db.save_records(make_eggs(), {table})
  })

  t.case('save_records (has_one)', async t => {
    let mock = t.mock(db)
    ;[1, 2, 3].forEach((x) => {
      mock.expects('update').withArgs(
        { _table: 'eggs', id: x },
        { $set: { _table: 'eggs', id: x, x, hen_id: x * 2 } },
        { upsert: true }
      )
    })
    let save_hens = t.spy()
    let eggs = make_eggs()
    await db.save_records(eggs, {
      table,
      relations: {
        hen: ['has_one', save_hens]
      }
    })

    t.is(save_hens.callCount, 1)
    let args = save_hens.getCall(0).args
    t.same(args, [eggs::pluck('hen')])
  })

  t.case('save_records (belongs_to)', async t => {
    t.stub(db, 'update')
    let spy = t.spy()
    let eggs = make_eggs()
    await db.save_records(eggs, {
      table,
      relations: {
        hen: ['belongs_to', spy]
      }
    })

    t.is(spy.callCount, 1)
    let args = spy.getCall(0).args
    t.same(args, [eggs::pluck('hen')])
    t.same([1, 2, 3], eggs::pluck('hen')::pluck('egg_id'))
  })

  t.case('save_records (has_many)', async t => {
    let eggs = [{
      id: 9,
      hens: [ {id: 19}, {id: 29}, {id: 39} ]
    }]
    let mock = t.mock(db)
    mock.expects('update').once().withArgs(
      { _table: 'eggs', id: 9 },
      { $set: { _table: 'eggs', id: 9, hen_ids: [19, 29, 39] } },
      { upsert: true }
    )
    let spy = t.spy()
    await db.save_records(eggs, {
      table,
      relations: {
        hens: ['has_many', spy]
      }
    })

    t.is(spy.callCount, 1)
    let args = spy.getCall(0).args
    t.same(args, [eggs[0].hens])
  })

  ;['download_keys', 'users', 'games', 'collections'].forEach((type) => {
    t.case(`save_${type}`, t => {
      t.mock(db).expects('save_records').once().resolves()
      return db[`save_${type}`]([{id: 55}])
    })
  })
})
