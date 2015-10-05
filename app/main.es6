
try {
  require("source-map-support").install();
} catch (e) {
  console.log("Failed to install source map support:\n#{e}");
}

(() => {
  if (require("./metal/squirrel").handle_startup_event()) {
    return
  }

  require("./metal/menu").install()
  require("./metal/notifier").install()
  require("./metal/stores/install_store").install()
  require("./metal/main_window").install()
})();

