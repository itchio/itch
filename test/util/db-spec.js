'use nodent';'use strict'
let test = require('zopf')
let proxyquire = require('proxyquire')
let pluck = require('underscore').pluck

let electron = require('../stubs/electron')

test('db', t => {
  let stubs = electron
  let db = proxyquire('../../app/util/db', stubs)

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

  t.case('load', t => {
    let mock = t.mock(db)
    mock.expects('load_database').once()
    return db.load()
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
        { _table: 'eggs', id: x, x },
        { upsert: true }
      )
    })
    return db.save_records(make_eggs(), {table})
  })

  t.case('save_records (has_one)', t => {
    let mock = t.mock(db)
    ;[1, 2, 3].forEach((x) => {
      mock.expects('update').withArgs(
        { _table: 'eggs', id: x },
        { _table: 'eggs', id: x, x, hen_id: x * 2 },
        { upsert: true }
      )
    })
    let save_hens = t.spy()
    let eggs = make_eggs()
    return db.save_records(eggs, {
      table,
      relations: {
        hen: ['has_one', save_hens]
      }
    }).then(() => {
      t.is(save_hens.callCount, 1)
      let args = save_hens.getCall(0).args
      t.same(args, [pluck(eggs, 'hen')])
    })
  })

  t.case('save_records (belongs_to)', t => {
    t.stub(db, 'update')
    let spy = t.spy()
    let eggs = make_eggs()
    return db.save_records(eggs, {
      table,
      relations: {
        hen: ['belongs_to', spy]
      }
    }).then(() => {
      t.is(spy.callCount, 1)
      let args = spy.getCall(0).args
      t.same(args, [pluck(eggs, 'hen')])
      t.same([1, 2, 3], pluck(pluck(eggs, 'hen'), 'egg_id'))
    })
  })

  t.case('save_records (has_many)', t => {
    let eggs = [{
      id: 9,
      hens: [ {id: 19}, {id: 29}, {id: 39} ]
    }]
    let mock = t.mock(db)
    mock.expects('update').once().withArgs(
      { _table: 'eggs', id: 9 },
      { _table: 'eggs', id: 9, hen_ids: [19, 29, 39] },
      { upsert: true }
    )
    let spy = t.spy()
    return db.save_records(eggs, {
      table,
      relations: {
        hens: ['has_many', spy]
      }
    }).then(() => {
      t.is(spy.callCount, 1)
      let args = spy.getCall(0).args
      t.same(args, [eggs[0].hens])
    })
  })

  ;['download_keys', 'users', 'games', 'collections'].forEach((type) => {
    t.case(`save_${type}`, t => {
      t.mock(db).expects('save_records').once().resolves()
      return db[`save_${type}`]([{id: 55}])
    })
  })
})
