
let glob = require('../../promised/glob')

// example installer names:
//  * pidgin-uninst.exe
//  * uninst.exe
//  * uninstall.exe
//  * unins000.exe
//  * unins001.exe
let pattern = '**/@(*uninst|uninstall|unins*).exe'

let find_uninstallers = async function (dest_path) {
  return await glob(pattern, {nodir: true, nocase: true, cwd: dest_path})
}

module.exports = find_uninstallers
