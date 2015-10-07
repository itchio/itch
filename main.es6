
try {
  require('source-map-support').install()
} catch (e) {
  console.log(`Failed to install source map support:\n${e}`)
}

require('./metal/crash_reporter').install()

if (require('./metal/squirrel').handle_startup_event()) {
  process.exit(0)
}

require('./metal/menu').install()
require('./metal/notifier').install()
require('./metal/stores/install_store').install()
require('./metal/main_window').install()
