
import spawn from './spawn'
import os from './os'

/*
 * Heavily based on https://github.com/int0h/npm-hddSpace
 */
let self = {
  dfRun: async () => {
    let lines = []
    let opts = {
      command: 'df', args: ['-kP'],
      onToken: (token) => lines.push(token)
    }
    await spawn(opts)
    return lines
  },

  df: async () => {
    let lines = await self.dfRun()

    let resultObj = {}
    let rootPart

    resultObj.parts = lines
      .slice(1) // remove header
      .map((line) => {
        let partInfo = {}
        let lineParts = line.split(/[\s]+/g)
        partInfo.mountpoint = lineParts[5]
        partInfo.free = parseInt(lineParts[3], 10) * 1024 // 1k blocks
        partInfo.size = parseInt(lineParts[1], 10) * 1024 // 1k blocks

        if (
          Number.isNaN(partInfo.free) ||
          Number.isNaN(partInfo.size)
        ) {
          return null
        }

        if (partInfo.mountpoint === '/') {
          rootPart = partInfo
        }
        return partInfo
      })
      .filter((part) => !!part)

    resultObj.total = {
      size: rootPart.size,
      free: rootPart.free
    }
    return resultObj
  },

  wmicRun: async () => {
    let lines = []
    let opts = {
      command: 'wmic', args: ['logicaldisk', 'get', 'size,freespace,caption'],
      onToken: (token) => lines.push(token)
    }
    await spawn(opts)
    return lines
  },

  wmicTotal: (parts) => {
    let initial = {size: 0, free: 0}
    let f = (total, part) => {
      total.size += part.size
      total.free += part.free
      return total
    }

    return parts.reduce(f, initial)
  },

  wmic: async () => {
    let lines = await self.wmicRun()

    let resultObj = {}
    resultObj.parts = lines
      .slice(1) // remove header
      .map((line) => {
        let part_info = {}
        let lineParts = line.split(/[\s]+/g)
        part_info.letter = lineParts[0]
        part_info.free = parseInt(lineParts[1], 10)
        part_info.size = parseInt(lineParts[2], 10)
        if (
          Number.isNaN(part_info.free) ||
          Number.isNaN(part_info.size) ||
          part_info.letter === ''
        ) {
          return null
        };
        return part_info
      })
      .filter((part) => !!part)

    resultObj.total = self.wmicTotal(resultObj.parts)
    return resultObj
  },

  diskInfo: async function () {
    if (os.platform() === 'win32') {
      return await self.wmic()
    } else {
      return await self.df()
    }
  },

  letterFor: function (folder) {
    let matches = folder.match(/^([A-Za-z]):/)
    if (!matches) {
      matches = folder.match(/^\/([A-Za-z])/)
    }

    if (!matches) {
      return null
    }

    return matches[1].toUpperCase() + ':'
  },

  freeInFolder: function (diskInfo, folder) {
    if (!diskInfo.parts) {
      // incomplete diskinfo
      return -1
    }

    if (typeof folder !== 'string') {
      console.log(`can't compute free space in ${folder}`)
      return -1
    }

    if (os.platform() === 'win32') {
      let letter = self.letterFor(folder)
      if (!letter) return -1

      for (let part of diskInfo.parts) {
        if (part.letter === letter) {
          // break out of loop, there's no nested mountpoints on Windows
          return part.free
        }
      }
    } else {
      let match = null

      for (let part of diskInfo.parts) {
        // TODO: what about case-insensitive FSes ?
        if (!folder.startsWith(part.mountpoint)) {
          continue // doesn't contain folder
        }

        if (match && match.mountpoint.length > part.mountpoint.length) {
          continue // skip, already got a longer match
        }
        match = part
      }

      if (match) return match.free
    }

    return -1
  }
}

export default self
