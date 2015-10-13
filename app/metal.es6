
console.log(`In metal, process type = ${process.type}`)

try {
  require('source-map-support').install()
} catch (e) {
  console.log(`Failed to install source map support:\n${e}`)
}

require('./util/crash_reporter').install()

if (require('./util/squirrel').handle_startup_event()) {
  process.exit(0)
}

require('./ui/menu').install()
require('./ui/notifier').install()
require('./ui/main_window').install()
require('./stores/install_store').install()
