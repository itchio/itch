(function() {
  var Promise, _, configure, find_and_fix_execs, fs, glob, log, path, read_chunk, sniff_format;

  Promise = require("bluebird");

  path = require("path");

  _ = require("underscore");

  fs = Promise.promisifyAll(require("fs"));

  glob = Promise.promisify(require("glob"));

  read_chunk = Promise.promisify(require("read-chunk"));

  log = function(msg) {
    return console.log("[configurators/linux] " + msg);
  };

  sniff_format = function(buf) {
    switch (false) {
      case !(buf[0] === 0x7F && buf[1] === 0x45 && buf[2] === 0x4C && buf[3] === 0x46):
        return 'elf executable';
      case !(buf[0] === 0x23 && buf[1] === 0x21):
        return 'shell script';
    }
  };

  find_and_fix_execs = function(app_path) {
    return glob(app_path + "/**/*", {
      nodir: true
    }).then(function(all_files) {
      return log("Probing " + all_files.length + " files for executables");
    }).map(function(file) {
      return read_chunk(file, 0, 8).then(sniff_format).then(function(format) {
        var short_path;
        if (!format) {
          return null;
        }
        short_path = path.relative(app_path, file);
        log(short_path + " looks like a " + format + ", +x'ing it");
        return fs.chmodAsync(file, 0x1ff).then(function() {
          return file;
        });
      });
    }, {
      concurrency: 4
    }).filter(function(x) {
      return x != null;
    });
  };

  configure = function(app_path) {
    return find_and_fix_execs(app_path).then(function(executables) {
      return {
        executables: executables
      };
    });
  };

  module.exports = {
    configure: configure
  };

}).call(this);

//# sourceMappingURL=../../app/maps/metal/configurators/linux.js.map
