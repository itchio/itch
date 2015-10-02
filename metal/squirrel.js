(function() {
  var app, handle_startup_event;

  app = require('app');

  handle_startup_event = function() {
    var squirrel_command;
    if (process.platform !== 'win32') {
      return false;
    }
    squirrel_command = process.argv[1];
    switch (squirrel_command) {
      case '--squirrel-install':
      case '--squirrel-updated':
        app.quit();
        return true;
      case '--squirrel-uninstall':
        app.quit();
        return true;
      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
  };

  module.exports = {
    handle_startup_event: handle_startup_event
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/squirrel.js.map
