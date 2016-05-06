
import Promise from 'bluebird'
import path from 'path'
import walk from 'walk'

import common from './common'

// const ignorePatterns = [
//   // skip some typical junk we find in archives that's supposed
//   // to be hidden / in trash / isn't in anyway relevant to what
//   // we're trying to do
//   '**/__MACOSX/**'
// ]

const self = {
  configure: async function (cavePath) {
    const bundles = []
    const walker = walk.walk(cavePath, {
      followLinks: false,
      filters: [ '__MACOSX' ]
    })

    walker.on('directory', (root, fileStats, next) => {
      if (/\.app$/i.test(fileStats.name)) {
        const fullPath = path.join(root, fileStats.name)
        const relPath = path.relative(cavePath, fullPath)
        bundles.push(relPath + '/')
      }
      next()
    })

    walker.on('errors', (root, nodeStatsArray, next) => {
      next()
    })

    await new Promise((resolve, reject) => {
      walker.on('end', resolve)
    })

    if (bundles.length) {
      const fixer = (x) => common.fixExecs('macExecutable', path.join(cavePath, x))
      await Promise.each(bundles, fixer)
      return {executables: bundles}
    }

    // some games aren't properly packaged app bundles but rather a shell
    // script / binary - try it the linux way
    const executables = await common.fixExecs('macExecutable', cavePath)
    return {executables}
  }
}

export default self
