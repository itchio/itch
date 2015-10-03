
try
  require("source-map-support").install()
catch e
  console.log "Failed to install source map support:\n#{e}"

return if require("./metal/squirrel").handle_startup_event()

app = require "app"

config = require "./metal/config"

require("./metal/menu").install()
require("./metal/notifier").install()
require("./metal/install_manager").install()
require("./metal/window").install()

