

let os = require('./os')

module.exports = require(`./auto-updater/${os.platform()}`)
