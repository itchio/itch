import test from 'zopf'
import proxyquire from 'proxyquire'
import fs from 'fs'

let setup = (t, logger_opts) => {
  let make = proxyquire('../app/util/log', {})
  let logger = new make.Logger(logger_opts)
  t.stub(logger, 'timestamp', () => 'time')
  let opts = {logger}

  let log = make('log-spec')
  return {opts, log}
}

test('log timestamp', t => {
  let {opts} = setup(t, {sinks: {console: false}})
  opts.logger.timestamp.restore()
  t.not(new Date(opts.logger.timestamp()).toString(), 'Invalid Date')
})

// serial because mocking global 'console.log'
test('log to console', t => {
  let {log, opts} = setup(t, {sinks: {console: true}})
  t.mock(console).expects('log').withArgs('[time] [log-spec] Hi mom')
  log(opts, 'Hi mom')
})

test('log to string', t => {
  let {log, opts} = setup(t, {sinks: {console: false, string: true}})
  log(opts, 'Hi mem')
  t.is(opts.logger.contents, '[time] [log-spec] Hi mem\n')
})

test('log to file', t => {
  let file = './tmp/log.log'
  try { fs.truncateSync(file) } catch (e) {}
  let {log, opts} = setup(t, {sinks: {console: false, file}})
  log(opts, 'Hi dad')

  opts.logger.close().then(() => {
    t.is('[time] [log-spec] Hi dad\n', fs.readFileSync(file, {encoding: 'utf8'}))
    try { fs.unlinkSync(file) } catch (e) {}
  })
})
