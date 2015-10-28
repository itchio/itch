
import os from './os'

export default require(`./auto-updater/${os.platform()}`)
