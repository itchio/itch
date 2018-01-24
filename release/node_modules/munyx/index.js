'use strict'

// base functions useful throughout CI scripts

const bluebird = require('bluebird');
require('bluebird').config({longStackTraces: true});
const childProcess = require('child_process')
const fs = bluebird.promisifyAll(require('fs'))
const ospath = require('path')
const crypto = require('crypto')
const readline = require('readline')

process.env.COLORTERM = '1'
const chalk = require('chalk')

let yarnCmd = 'yarn'
if (process.platform === 'win32') {
  yarnCmd = 'yarn.cmd'
}

const STDIN = 0;

const SH_PATH = (process.platform === 'win32') ? `sh.exe` : '/bin/sh'

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  process.exit(1);
});

const $ = function (val) {
  if (!val) {
    throw new Error('Exit code assertion failed, bailing out')
  }
}

$.HOMEPAGE = 'https://itch.io/app'
$.MAINTAINER = 'Amos Wenger <amos@itch.io>'
$.DESCRIPTION = 'The best way to play itch.io games'

$.BUILD_TIME = new Date()

$.RETRY_COUNT = 5
$.HOME = process.env.HOME || process.env.USERPROFILE

$.OSES = {
  windows: {},
  darwin: {},
  linux: {}
}

$.ARCHES = {
  ['386']: {
    electronArch: 'ia32'
  },
  amd64: {
    electronArch: 'x64'
  }
}

$.addToPath = function (element) {
  process.env.PATH += ospath.delimiter + element
}

// local golang executables
$.GOPATH = ospath.join($.HOME, 'go')
process.env.GOPATH = $.GOPATH
$.addToPath(ospath.join($.GOPATH, 'bin'))

// local npm executables
$.addToPath(ospath.resolve(__dirname, '..', 'node_modules', '.bin'))

$.VERSION_SPECS = {
  ['7za']: '7za | head -2',
  node: 'node --version',
  npm: 'npm --version',
  yarn: `${yarnCmd} --version`,
  gsutil: 'gsutil --version',
  go: 'go version',
  gothub: 'gothub --version',
  fakeroot: 'fakeroot -v',
  ar: 'ar --version | head -1'
}

$.benchmark = false

$.putln = function (s) {
  process.stdout.write(s + '\n')
  return true
}

$.showVersions = async function (names) {
  await bluebird.each(names, async function (name) {
    const v = (await $.getOutput($.VERSION_SPECS[name])).trim()
    $.putln(chalk.yellow(`★ ${name} ${v}`))
  })
  return true
}

$.say = function (cmd) {
  $.putln(chalk.yellow(`♦ ${cmd}`))
  return true
}

$.measure = async function (name, cb) {
  const start = Date.now();
  const ret = await cb();
  const end = Date.now();
  const ms = end - start;
  $.putln(chalk.cyan(`⌚ ${name} took ${(ms / 1000).toFixed(3)}s`));
  return ret;
}

async function system (cmd, opts = {}) {
  const start = Date.now();

  const child = childProcess.spawn(SH_PATH, ['-c', cmd], {
    stdio: 'inherit'
  })

  try {
    const status = await new bluebird((resolve, reject) => {
      child.on('close', resolve);
      child.on('error', reject);
    });

    if (status !== 0) {
      $.putln(chalk.red(`☃ non-zero exit code: ${status}`))
      $.putln(chalk.red(`...at ${new Error().stack}`))
      return false
    }
  } catch (error) {
    $.putln(chalk.red(`☃ error executing ${cmd}`));
    $.putln(chalk.red(`...at ${error.stack}`));
    return false
  }

  if ($.benchmark) {
    const end = Date.now();
    const ms = end - start;
    $.putln(chalk.cyan(`⌚ ${cmd} took ${(ms / 1000).toFixed(3)}s`));
  }

  return true
}

$.getOutput = async function (cmd) {
  const start = Date.now();

  const child = childProcess.spawn(SH_PATH, ['-c', cmd], {
    encoding: 'utf8'
  })

  let stdout = "";
  child.stdout.on("data", (data) => { stdout += data });
  let stderr = "";
  child.stderr.on("data", (data) => { stderr += data });

  try {
    const status = await new bluebird((resolve, reject) => {
      child.on('close', resolve);
      child.on('error', reject);
    });

    if (status !== 0) {
      $.putln(chalk.red(`☃ non-zero exit code: ${status}`))
      $.putln(chalk.red(`...at ${new Error().stack}`))
      $.putln(chalk.red(`stderr: ${stderr}`))
      throw new Error("getOutput: non-zero exit code");
    }
  } catch (error) {
    $.putln(chalk.red(`☃ error executing ${cmd}`));
    $.putln(chalk.red(`...at ${error.stack}`));
    $.putln(chalk.red(`stderr: ${stderr}`))
    throw new Error("getOutput: couldn't execute command");
  }

  if ($.benchmark) {
    const end = Date.now();
    const ms = end - start;
    $.putln(chalk.cyan(`⌚ ${cmd} (getOutput) took ${(ms / 1000).toFixed(3)}s`));
  }

  return stdout;
}

$.sh = async function (cmd) {
  $.putln(chalk.blue(`· ${cmd}`))
  return await system(cmd)
}

$.qsh = async function (cmd) {
  $.putln(chalk.blue('· <redacted>'))
  return await system(cmd)
}

// run npm command (silently)
$.npm = async function (args) {
  return await $.sh(`npm --no-progress --quiet ${args}`)
}

// run yarn command
$.yarn = async function (args) {
  return await $.sh(`${yarnCmd} ${args}`)
}

// run gem command
$.gem = async function (args) {
  return await $.sh(`gem ${args}`)
}

// run grunt command
$.grunt = async function (args) {
  return await $.sh(`grunt ${args}`)
}

// run go command
$.go = async function (args) {
  return await $.sh(`go ${args}`)
}

// copy files to google cloud storage using gsutil
$.gcp = async function (args) {
  return await $.sh(`gsutil -m cp -r -a public-read ${args}`)
}

// manage github assets
$.gothub = async function (args) {
  process.env.GITHUB_USER = 'itchio'
  process.env.GITHUB_REPO = $.appName()
  return await $.sh(`gothub ${args}`)
}

$.goDep = async function (cmd, pkg) {
  if (await system(`which ${cmd} > /dev/null`)) {
    $.putln(chalk.yellow(`★ got ${cmd}`))
    return true
  } else {
    $.putln(chalk.yellow(`☁ installing ${cmd}`))
    return await $.go(`get ${pkg}`)
  }
}

$.gemDep = async function (cmd, pkg) {
  if (await system(`which ${cmd} > /dev/null`)) {
    $.putln(chalk.yellow(`★ got ${cmd}`))
    return true
  } else {
    $.putln(chalk.yellow(`☁ installing ${cmd}`))
    return await $.gem(`install ${pkg}`)
  }
}

$.npmDep = async function (cmd, pkg) {
  if (await system(`which ${cmd} > /dev/null`)) {
    $.putln(chalk.yellow(`★ got ${cmd}`))
    return true
  } else {
    $.putln(chalk.yellow(`☁ installing ${cmd}`))
    return await $.npm(`install ${pkg}`)
  }
}

$.ensure = $

$.retry = async function (cb) {
  var tries = 0
  while (tries < $.RETRY_COUNT) {
    if (tries > 0) {
      $.say(`Command failed, waiting 30s then trying ${$.RETRY_COUNT - tries} more time(s).`)
      // naughty, but don't want to pull in node-sleep (native modules)
      // or turn everything into async (babel-cli = huge)
      await new bluebird((resolve, reject) => {
        setTimeout(resolve, 30 * 1000);
      })
    }
    if (await cb()) {
      // cmd returned truthy value, was successful
      return
    }
    tries++
  }
  throw new Error(`Tried ${$.RETRY_COUNT} times, bailing out`)
}

$.prompt = async function (msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const answer = await new Promise((resolve, reject) => {
    rl.question(chalk.green(`${msg}: `), (line) => {
      resolve(line);
    })
  })

  rl.close();

  return answer;
}

$.yesno = async function (msg) {
  const s = await $.prompt(`${msg} (y/N)`);
  if (s !== 'y') {
    $.say('Bailing out...')
    process.exit(0)
  }
}

$.cd = async function (dir, cb) {
  const originalWd = process.cwd()
  var e
  var ret

  $.putln(chalk.magenta(`☞ entering ${dir}`))
  process.chdir(dir)
  try {
    ret = await cb()
  } catch (err) {
    e = err
  } finally {
    $.putln(chalk.magenta(`☜ leaving ${dir}`))
    process.chdir(originalWd)
  }

  if (e) {
    throw e
  }
  return ret
}

// environment variables etc.

$.buildRefName = function () {
  const v = process.env.CI_BUILD_REF_NAME
  if (!v) {
    throw new Error('No build ref!')
  }
  return v
}

$.buildTag = function () {
  const v = process.env.CI_BUILD_TAG
  if (!v) {
    throw new Error('No build tag!')
  }
  return v
}

$.buildVersion = function () {
  return $.buildTag().replace(/^v/, '').replace(/-.+$/, '')
}

$.appName = function () {
  if (/-canary$/.test($.buildTag())) {
    return 'kitch'
  } else {
    return 'itch'
  }
}

$.channelName = function () {
  if (/-canary$/.test($.buildTag())) {
    return 'canary'
  } else {
    return 'stable'
  }
}

$.toDebArch = function (arch) {
  switch (arch) {
    case '386': return 'i386'
    case 'amd64': return 'amd64'
    default: throw new Error(`Unsupported arch ${arch}`)
  }
}

$.toRpmArch = function (arch) {
  switch (arch) {
    case '386': return 'i386'
    case 'amd64': return 'x86_64'
    default: throw new Error(`Unsupported arch ${arch}`)
  }
}

$.buildTime = function () {
  return $.BUILD_TIME
}

$.readFile = async function (file) {
  return await fs.readFileAsync(file, {encoding: 'utf8'})
}

$.writeFile = async function (file, contents) {
  return await fs.writeFileAsync(file, contents, {encoding: 'utf8'})
}

$.ls = async function (dir) {
  return await fs.readdirAsync(dir)
}

$.lstat = async function (path) {
  return await fs.lstatAsync(path)
}

$.chmod = async function (mode, path) {
  await fs.chmodAsync(path, mode)
}

$.findAllFiles = async function (path) {
  let files = []
  const stat = await $.lstat(path)
  if (stat.isDirectory()) {
    await bluebird.each($.ls(path), async (child) => {
      files = files.concat(await $.findAllFiles(ospath.join(path, child)))
    })
  } else {
    files.push(path)
  }
  return files
}

$.md5 = async function (path) {
  const buf = await fs.readFileAsync(path, {encoding: null})
  return crypto.createHash('md5').update(buf).digest('hex')
}

$.leftPad = function (input, len, filler) {
  let res = input
  while (res.length < len) {
    res = `${filler}${res}`
  }
  return res
}

// $.say(`PATH: ${process.env.PATH}`)

module.exports = $

