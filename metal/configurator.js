(function() {
  var Promise, _, configure, fs, glob, path, read_chunk;

  read_chunk = require("read-chunk");

  fs = require("fs");

  path = require("path");

  glob = require("glob");

  _ = require("underscore");

  Promise = require("bluebird");

  configure = function(app_path) {
    console.log("Configuring app at '" + app_path + "'");
    switch (process.platform) {
      case "darwin":
      case "win32":
      case "linux":
        return require("./configurators/" + process.platform).configure(app_path);
      default:
        return console.log("Unsupported platform: " + process.platform);
    }
  };

  module.exports = {
    configure: configure
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/configurator.js.map
