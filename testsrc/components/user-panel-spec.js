
let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')

let sd = require('./skin-deeper')
let stubs = require('../stubs/react-stubs')

test('user-panel', t => {
  let UserPanel = proxyquire('../../app/components/user-panel', stubs)

  t.case('UserPanel', t => {
    let state = mori.toClj({
      credentials: {
        me: {
          cover_url: 'https://example.org/img.png',
          username: 'toto'
        }
      }
    })

    sd.shallowRender(sd(UserPanel, {state}))
  })
})
