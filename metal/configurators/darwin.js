(function() {
  var Promise, _, configure, fix_permissions, fs, glob, log, path, read_chunk, skip_junk, sniff_format;

  Promise = require("bluebird");

  path = require("path");

  _ = require("underscore");

  fs = Promise.promisifyAll(require("fs"));

  glob = Promise.promisify(require("glob"));

  read_chunk = Promise.promisify(require("read-chunk"));

  log = function(msg) {
    return console.log("[configurators/darwin] " + msg);
  };

  skip_junk = function(bundle_paths, app_path) {
    return bundle_paths.filter(function(file) {
      return !/^__MACOSX/.test(path.relative(app_path, file));
    });
  };

  sniff_format = function(buf) {
    switch (false) {
      case !(buf[0] === 0xCE && buf[1] === 0xFA && buf[2] === 0xED && buf[3] === 0xFE):
        return 'mach-o executable';
      case !(buf[0] === 0x23 && buf[1] === 0x21):
        return 'shell script';
    }
  };

  fix_permissions = function(bundle_path) {
    return glob(bundle_path + "/**/*", {
      nodir: true
    }).then(function(all_files) {
      log("Probing " + all_files.length + " files for executables");
      return all_files;
    }).map(function(file) {
      return read_chunk(file, 0, 8).then(sniff_format).then(function(format) {
        var short_path;
        if (!format) {
          return;
        }
        short_path = path.relative(bundle_path, file);
        log(short_path + " looks like a " + format + ", +x'ing it");
        return fs.chmodAsync(file, 0x1ff);
      });
    }, {
      concurrency: 4
    }).then(function() {
      return bundle_path;
    });
  };

  configure = function(app_path) {
    return glob(app_path + "/**/*.app/").then(function(bundle_paths) {
      return skip_junk(bundle_paths, app_path);
    }).then(function(bundle_paths) {
      return Promise.all(bundle_paths.map(fix_permissions));
    }).then(function(executables) {
      return {
        executables: executables
      };
    });
  };

  module.exports = {
    configure: configure
  };

}).call(this);

//# sourceMappingURL=../../app/maps/metal/configurators/darwin.js.map
