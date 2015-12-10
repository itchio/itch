'use strict'


let test = require('zopf')
let mori = require('mori')
let proxyquire = require('proxyquire')
let sd = require('skin-deep')

let electron = require('../stubs/electron')

let $ = require('react').createElement

test('SetupPage', t => {
  let SetupPage = proxyquire('../../app/components/setup', electron).SetupPage

  let props = {
    icon: 'configure',
    message: 'Ah well'
  }

  t.case('renders', t => {
    sd.shallowRender($(SetupPage, {state: mori.toClj(props)}))
  })
})
