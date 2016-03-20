
import test from 'zopf'
import proxyquire from 'proxyquire'
import fs from 'fs'
import os from 'os'

// TODO: mock fs in these tests

const setup = (t, loggerOpts) => {
  const mklog = proxyquire('../../app/util/log', {}).default
  const logger = new mklog.Logger(loggerOpts)
  t.stub(logger, 'timestamp', () => 'time')
  const opts = {logger}

  const log = mklog('log-spec')
  return {opts, log}
}

test('log', t => {
  t.case('timestamp', t => {
    const r = setup(t, {sinks: {console: false}})
    r.opts.logger.timestamp.restore()
    t.not(new Date(r.opts.logger.timestamp()).toString(), 'Invalid Date')
  })

  t.case('to console', t => {
    const r = setup(t, {sinks: {console: true}})
    t.mock(console).expects('log').withArgs('[time] [log-spec] Hi mom')
    r.log(r.opts, 'Hi mom')
  })

  t.case('to string', t => {
    const r = setup(t, {sinks: {console: false, string: true}})
    r.log(r.opts, 'Hi mem')
    t.is(r.opts.logger.contents, '[time] [log-spec] Hi mem' + os.EOL)
  })

  t.case('to file', async t => {
    const file = './tmp/log.log'
    try { fs.truncateSync(file) } catch (e) {}
    const r = setup(t, {sinks: {console: false, file}})
    r.log(r.opts, 'Hi dad')

    await r.opts.logger.close()
    const contents = fs.readFileSync(file, {encoding: 'utf8'})
    try { fs.unlinkSync(file) } catch (e) {}

    t.is('[time] [log-spec] Hi dad' + require('os').EOL, contents)
  })
})
