(function() {
  var Promise, _, configure, glob, log;

  _ = require("underscore");

  Promise = require("bluebird");

  glob = Promise.promisify(require("glob"));

  log = function(msg) {
    return console.log("[configurators/win32] " + msg);
  };

  configure = function(app_path) {
    var promises;
    promises = ['exe', 'bat'].map(function(ext) {
      return glob(app_path + "/**/*." + ext);
    });
    return Promise.all(promises).then(_.flatten).then(function(executables) {
      log("Found " + executables.length + " executables");
      return {
        executables: executables
      };
    });
  };

  module.exports = {
    configure: configure
  };

}).call(this);

//# sourceMappingURL=../../app/maps/metal/configurators/win32.js.map
