
import needle from '../../promised/needle'
import urls from '../../constants/urls'

import querystring from 'querystring'
import humanize from 'humanize-plus'

import sf from '../sf'
import os from '../os'
import version from './version'
import path from 'path'

import {indexBy, filter, map, contains} from 'underline'

import invariant from 'invariant'

import mklog from '../log'
const log = mklog('ibrew/net')

const CHECKSUM_ALGOS = [
  'SHA256',
  'SHA1'
]

/**
 * Download to file without butler, because it's used
 * to install butler
 */
async function downloadToFile (opts, url, file) {
  let e = null
  let totalSize = 0
  let req = needle.get(url, (err, res) => {
    e = err
    if (res) {
      totalSize = parseInt(res.headers['content-length'], 10)
    }
  })
  await sf.mkdir(path.dirname(file))
  log(opts, `downloading ${url} to ${file}`)
  let sink = sf.createWriteStream(file, {flags: 'w', mode: 0o777, defaultEncoding: 'binary'})
  req.pipe(sink)
  await sf.promised(sink)

  if (e) {
    throw e
  }

  const stats = await sf.lstat(file)
  log(opts, `downloaded ${humanize.fileSize(stats.size)} / ${humanize.fileSize(totalSize)} (${stats.size} bytes)`)

  if (totalSize !== 0 && stats.size !== totalSize) {
    throw new Error(`download failed (short size) for ${url}`)
  }
}

/** platform in go format */
function goos () {
  let result = os.platform()
  if (result === 'win32') {
    return 'windows'
  }
  return result
}

/** arch in go format */
function goarch () {
  let result = os.arch()
  if (result === 'x64') {
    return 'amd64'
  } else if (result === 'ia32') {
    return '386'
  } else {
    return 'unknown'
  }
}

/** build channel URL */
function channel (formulaName) {
  let osArch = `${goos()}-${goarch()}`
  return `${urls.ibrewRepo}/${formulaName}/${osArch}`
}

/** fetch latest version number from repo */
async function getLatestVersion (channel) {
  const url = `${channel}/LATEST?${querystring.stringify({t: +new Date()})}`
  const res = await needle.getAsync(url)

  if (res.statusCode !== 200) {
    throw new Error(`got HTTP ${res.statusCode} while fetching ${url}`)
  }

  const v = res.body.toString('utf8').trim()
  return version.normalize(v)
}

async function getChecksums (opts, channel, v, algo) {
  invariant(CHECKSUM_ALGOS::contains(algo), 'checksum algo needs to be known')

  const url = `${channel}/v${v}/${algo}SUMS`
  const res = await needle.getAsync(url)

  if (res.statusCode !== 200) {
    log(opts, `couldn't get hashes: HTTP ${res.statusCode}, for ${url}`)
    return null
  }

  const lines = res.body.toString('utf8').split('\n')

  return lines::map((line) => {
    const matches = /^(\S+)\s+(\S+)$/.exec(line)
    if (matches) {
      return {
        hash: matches[1],
        path: matches[2]
      }
    }
  })::filter((x) => !!x)::indexBy('path')
}

export default {downloadToFile, getLatestVersion, channel, getChecksums, goos, goarch, CHECKSUM_ALGOS}
