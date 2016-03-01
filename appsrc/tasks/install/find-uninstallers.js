
import sf from '../../util/sf'

// example installer names:
//  * pidgin-uninst.exe
//  * uninst.exe
//  * uninstall.exe
//  * unins000.exe
//  * unins001.exe
const pattern = '**/@(*uninst|uninstall|unins*).exe'

const find_uninstallers = async function (dest_path) {
  return await sf.glob(pattern, {nodir: true, nocase: true, cwd: dest_path})
}

export default find_uninstallers
