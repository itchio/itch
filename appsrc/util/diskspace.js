
import spawn from './spawn'
import os from './os'

/*
 * Heavily based on https://github.com/int0h/npm-hddSpace
 */
let self = {
  df_run: async () => {
    let lines = []
    let opts = {
      command: 'df', args: ['-kP'],
      ontoken: (token) => lines.push(token)
    }
    await spawn(opts)
    return lines
  },

  df: async () => {
    let lines = await self.df_run()

    let result_obj = {}
    let rootPart

    result_obj.parts = lines
      .slice(1) // remove header
      .map((line) => {
        let part_info = {}
        let line_parts = line.split(/[\s]+/g)
        part_info.mountpoint = line_parts[5]
        part_info.free = parseInt(line_parts[3], 10) * 1024 // 1k blocks
        part_info.size = parseInt(line_parts[1], 10) * 1024 // 1k blocks

        if (
          Number.isNaN(part_info.free) ||
          Number.isNaN(part_info.size)
        ) {
          return null
        }

        if (part_info.mountpoint === '/') {
          rootPart = part_info
        };
        return part_info
      })
      .filter((part) => !!part)

    result_obj.total = {
      size: rootPart.size,
      free: rootPart.free
    }
    return result_obj
  },

  wmic_run: async () => {
    let lines = []
    let opts = {
      command: 'wmic', args: ['logicaldisk', 'get', 'size,freespace,caption'],
      ontoken: (token) => lines.push(token)
    }
    await spawn(opts)
    return lines
  },

  wmic_total: (parts) => {
    let initial = { size: 0, free: 0 }
    let f = (total, part) => {
      total.size += part.size
      total.free += part.free
      return total
    }

    return parts.reduce(f, initial)
  },

  wmic: async () => {
    let lines = await self.wmic_run()

    let result_obj = {}
    result_obj.parts = lines
      .slice(1) // remove header
      .map((line) => {
        let part_info = {}
        let line_parts = line.split(/[\s]+/g)
        part_info.letter = line_parts[0]
        part_info.free = parseInt(line_parts[1], 10)
        part_info.size = parseInt(line_parts[2], 10)
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

    result_obj.total = self.wmic_total(result_obj.parts)
    return result_obj
  },

  disk_info: async function () {
    if (os.platform() === 'win32') {
      return await self.wmic()
    } else {
      return await self.df()
    }
  },

  letter_for: function (folder) {
    let matches = folder.match(/^([A-Za-z]):/)
    if (!matches) {
      matches = folder.match(/^\/([A-Za-z])/)
    }

    if (!matches) {
      return null
    }

    return matches[1].toUpperCase() + ':'
  },

  free_in_folder: function (disk_info, folder) {
    if (typeof folder !== 'string') {
      console.log(`can't compute free space in ${folder}`)
      return -1
    }

    if (os.platform() === 'win32') {
      let letter = self.letter_for(folder)
      if (!letter) return -1

      for (let part of disk_info.parts) {
        if (part.letter === letter) {
          // break out of loop, there's no nested mountpoints on Windows
          return part.free
        }
      }
    } else {
      let match = null

      for (let part of disk_info.parts) {
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
