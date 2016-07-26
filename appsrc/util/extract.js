
import {object} from 'underline'

import invariant from 'invariant'
import humanize from 'humanize-plus'
import ospath from 'path'
import fnout from 'fnout'

import mklog from './log'
const log = mklog('util/extract')

const verbose = (process.env.THE_DEPTHS_OF_THE_SOUL === '1')
const USE_SEVENZIP = (process.env.ITCH_PRAYS_TO_THE_SEVEN_GODS === '1')

import formulas from './ibrew/formulas'
import version from './ibrew/version'

import os from './os'
import noop from './noop'
import sf from './sf'
import spawn from './spawn'
import butler from './butler'

const self = {
  sevenzipList: async function (command, v, logger, archivePath) {
    const opts = {logger}
    const sizes = {}
    let totalSize = 0

    await spawn({
      command,
      args: ['-slt', 'l', archivePath],
      split: '\n\n',
      onToken: (token) => {
        const item = token.split('\n').map((x) => x.replace(/\r$/, '').split(' = '))::object()
        if (!item.Size || !item.Path) return
        if (verbose) {
          log(opts, `list: ${item.Size} | ${item.Path}`)
        }
        const itemPath = ospath.normalize(item.Path)
        const size = parseInt(item.Size, 10)

        totalSize += (sizes[itemPath] = size)
      },
      logger
    })
    return {sizes, totalSize}
  },

  sevenzipExtract: async function (command, v, logger, archivePath, destPath, onProgress) {
    const opts = {logger}
    let errState = false
    let err

    let EXTRACT_RE = /^Extracting\s+(.+)$/
    let additionalArgs = []

    if (/^15/.test(v)) {
      EXTRACT_RE = /^-\s(.+)$/
      additionalArgs.push('-bb1')
    }

    await sf.mkdir(destPath)

    const args = ['x', archivePath, '-o' + destPath, '-y'].concat(additionalArgs)
    await spawn({
      command,
      args,
      split: '\n',
      onToken: (token) => {
        if (verbose) {
          log(opts, `extract: ${token}`)
        }
        if (errState) {
          if (!err) err = token
          return
        }
        if (token.match(/^Error:/)) {
          errState = 1
          return
        }

        let matches = EXTRACT_RE.exec(token)
        if (!matches) {
          return
        }

        let itemPath = ospath.normalize(matches[1])
        onProgress(itemPath)
      },
      logger
    })

    if (err) throw err
  },

  sevenzip: async function (opts) {
    const {archivePath, destPath, onProgress = noop, command = '7za', logger} = opts

    const check = formulas['7za'].versionCheck
    const sevenzipInfo = await os.assertPresence('7za', check.args, check.parser)
    const v = version.normalize(sevenzipInfo.parsed)

    log(opts, `using 7-zip version ${v}`)

    let extractedSize = 0
    let totalSize = 0

    const info = await self.sevenzipList(command, v, logger, archivePath)
    totalSize = info.totalSize
    log(opts, `archive contains ${Object.keys(info.sizes).length} files, ${humanize.fileSize(totalSize)} total`)

    const sevenzipProgress = (f) => {
      extractedSize += (info.sizes[f] || 0)
      const percent = extractedSize / totalSize * 100
      onProgress({extractedSize, totalSize, percent})
    }
    await self.sevenzipExtract(command, v, logger, archivePath, destPath, sevenzipProgress)
  },

  unarchiverList: async function (logger, archivePath) {
    const opts = {logger}

    const sizes = {}
    let totalSize = 0

    const contents = await spawn.getOutput({
      command: 'lsar',
      args: ['-j', archivePath],
      logger
    })
    const info = JSON.parse(contents)

    if (verbose) {
      log(opts, `${info.lsarContents.length} lsarContent entries`)
    }
    for (const entry of info.lsarContents) {
      if (verbose) {
        log(opts, `${entry.XADFileName} ${entry.XADFileSize}`)
      }
      sizes[ospath.normalize(entry.XADFileName)] = entry.XADFileSize
      totalSize += entry.XADFileSize
    }

    return {sizes, totalSize}
  },

  unarchiverExtract: async function (logger, archivePath, destPath, onProgress) {
    const opts = {logger}

    let EXTRACT_RE = /^ {2}(.+) {2}\(.+\)\.\.\. OK\.$/

    await sf.mkdir(destPath)

    const args = [
      // Always overwrite files when a file to be unpacked already exists on disk.
      // By default, the program asks the user if possible, otherwise skips the file.
      '-force-overwrite',
      // Never create a containing directory for the contents of the unpacked archive.
      '-no-directory',
      // The directory to write the contents of the archive to. Defaults to the
      // current directory. If set to a single dash (-), no files will be created,
      // and all data will be output to stdout.
      '-output-directory', destPath,
      // file to unpack
      archivePath
    ]

    let out = ''

    const code = await spawn({
      command: 'unar',
      args,
      split: '\n',
      onToken: (token) => {
        if (verbose) {
          log(opts, `extract: ${token}`)
        }
        out += token

        let matches = EXTRACT_RE.exec(token)
        if (verbose) {
          log(opts, `matches: ${matches}`)
        }
        if (!matches) {
          return
        }

        let itemPath = ospath.normalize(matches[1])
        if (verbose) {
          log(opts, `itemPath: ${itemPath}`)
        }
        onProgress(itemPath)
      },
      logger
    })

    if (code !== 0) {
      throw new Error(`unarchiver failed: ${out}`)
    }
  },

  unarchiver: async function (opts) {
    const {archivePath, destPath, onProgress = noop, logger} = opts

    let extractedSize = 0
    let totalSize = 0

    const info = await self.unarchiverList(logger, archivePath)
    totalSize = info.totalSize
    log(opts, `archive contains ${Object.keys(info.sizes).length} files, ${humanize.fileSize(totalSize)} total`)

    const unarchiverProgress = (f) => {
      if (verbose) {
        log(opts, `progress!: ${f} ${info.sizes[f]}`)
      }
      extractedSize += (info.sizes[f] || 0)
      const percent = extractedSize / totalSize * 100
      onProgress({extractedSize, totalSize, percent})
    }
    await self.unarchiverExtract(logger, archivePath, destPath, unarchiverProgress)
  },

  extract: async function (opts) {
    const {archivePath, destPath} = opts
    invariant(typeof archivePath === 'string', 'extract needs string archivePath')
    invariant(typeof destPath === 'string', 'extract needs string destPath')

    let type = await fnout.path(archivePath)
    if (type.ext === 'tar') {
      log(opts, 'using butler')
      return await butler.untar(opts)
    } else {
      if (USE_SEVENZIP) {
        return await self.sevenzip(opts)
      } else {
        return await self.unarchiver(opts)
      }
    }
  }
}

export default self
