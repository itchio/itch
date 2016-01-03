
let spawn = require('./spawn')

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

  run: async function () {
    if (process.platform === 'win32') {
      return await self.wmic()
    } else {
      return await self.df()
    }
  }
}

module.exports = self
