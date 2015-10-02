(function() {
  var Humanize, Promise, VERY_VERBOSE, extract, file_type, fs, glob, is_tar, normalize, path, read_chunk, sevenzip;

  Promise = require("bluebird");

  glob = Promise.promisify(require("glob"));

  fs = Promise.promisifyAll(require("fs"));

  file_type = require("file-type");

  read_chunk = require("read-chunk");

  path = require("path");

  sevenzip = require("node-7z");

  Humanize = require("humanize-plus");

  switch (process.platform) {
    case "darwin":
      process.env.PATH += ':.';
  }

  normalize = function(p) {
    return path.normalize(p.replace(/[\s]*$/, ""));
  };

  is_tar = function(file) {
    var ref;
    return ((ref = file_type(read_chunk.sync(file, 0, 262))) != null ? ref.ext : void 0) === 'tar';
  };

  VERY_VERBOSE = false;

  extract = function(archive_path, dest_path) {
    var extracted_size, handlers, li, p, sizes, total_size;
    console.log("Extracting archive '" + archive_path + "' to '" + dest_path + "' with 7-Zip");
    li = new sevenzip().list(archive_path);
    sizes = {};
    total_size = 0;
    extracted_size = 0;
    handlers = {
      onprogress: null
    };
    li.progress(function(files) {
      var f, i, len, npath, results;
      if (VERY_VERBOSE) {
        console.log("Got info about " + files.length + " files");
      }
      results = [];
      for (i = 0, len = files.length; i < len; i++) {
        f = files[i];
        total_size += f.size;
        npath = normalize(f.name);
        sizes[npath] = f.size;
        if (VERY_VERBOSE) {
          results.push(console.log(npath + " (" + f.size + " bytes)"));
        } else {
          results.push(void 0);
        }
      }
      return results;
    });
    p = li.then(function(spec) {
      var xr;
      console.log("total extracted size: " + total_size);
      xr = new sevenzip().extractFull(archive_path, dest_path);
      xr.progress(function(files) {
        var f, i, len, npath, percent, size;
        if (VERY_VERBOSE) {
          console.log("Got progress about " + files.length + " files");
        }
        for (i = 0, len = files.length; i < len; i++) {
          f = files[i];
          npath = normalize(f);
          if (size = sizes[npath]) {
            extracted_size += size;
            if (VERY_VERBOSE) {
              console.log(npath + " (" + size + " bytes)");
            }
          } else {
            if (VERY_VERBOSE) {
              console.log(npath + " (size not found)");
            }
          }
        }
        percent = Math.round(extracted_size / total_size * 100);
        console.log("Estimated progress: " + (Humanize.fileSize(extracted_size)) + " of " + (Humanize.fileSize(total_size)) + " bytes, ~" + percent + "%");
        return typeof handlers.onprogress === "function" ? handlers.onprogress({
          extracted_size: extracted_size,
          total_size: total_size,
          percent: percent
        }) : void 0;
      });
      return xr;
    }).then(function() {
      return glob(dest_path + "/**/*", {
        nodir: true
      });
    }).then(function(files) {
      var tar;
      if (files.length === 1 && is_tar(files[0])) {
        tar = files[0];
        console.log("Found tar: " + tar);
        console.log("Whereas dest_path is " + dest_path);
        return extract(tar, dest_path).then(function(res) {
          return fs.unlinkAsync(tar).then(function() {
            return res;
          });
        });
      } else {
        return {
          total_size: total_size
        };
      }
    });
    p.progress = function(callback) {
      handlers.onprogress = callback;
      return p;
    };
    return p;
  };

  module.exports = {
    extract: extract
  };

}).call(this);

//# sourceMappingURL=../../app/maps/metal/extractors/7zip.js.map
