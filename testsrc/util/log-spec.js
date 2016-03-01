
import test from 'zopf'
import proxyquire from 'proxyquire'
import fs from 'fs'
import os from 'os'

let setup = (t, logger_opts) => {
  let make = proxyquire('../../app/util/log', {})
  let logger = new make.Logger(logger_opts)
  t.stub(logger, 'timestamp', () => 'time')
  let opts = {logger}

  let log = make('log-spec')
  return {opts, log}
}

test('log', t => {
  t.case('timestamp', t => {
    let r = setup(t, {sinks: {console: false}})
    r.opts.logger.timestamp.restore()
    t.not(new Date(r.opts.logger.timestamp()).toString(), 'Invalid Date')
  })

  t.case('to console', t => {
    let r = setup(t, {sinks: {console: true}})
    t.mock(console).expects('log').withArgs('[time] [log-spec] Hi mom')
    r.log(r.opts, 'Hi mom')
  })

  t.case('to string', t => {
    let r = setup(t, {sinks: {console: false, string: true}})
    r.log(r.opts, 'Hi mem')
    t.is(r.opts.logger.contents, '[time] [log-spec] Hi mem' + os.EOL)
  })

  t.case('to file', async t => {
    let file = './tmp/log.log'
    try { fs.truncateSync(file) } catch (e) {}
    let r = setup(t, {sinks: {console: false, file}})
    r.log(r.opts, 'Hi dad')

    await r.opts.logger.close()
    let contents = fs.readFileSync(file, {encoding: 'utf8'})
    try { fs.unlinkSync(file) } catch (e) {}

    t.is('[time] [log-spec] Hi dad' + require('os').EOL, contents)
  })
})
