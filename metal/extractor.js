(function() {
  var Promise, extract, file_type, read_chunk;

  read_chunk = require("read-chunk");

  file_type = require("file-type");

  Promise = require("bluebird");

  extract = function(archive_path, dest_path) {
    var buffer, p, type;
    buffer = read_chunk.sync(archive_path, 0, 262);
    type = file_type(buffer);
    console.log("type for " + archive_path + ": " + (JSON.stringify(type)));
    switch (type.ext) {
      case 'zip':
      case 'gz':
      case 'bz2':
      case '7z':
        return require("./extractors/7zip").extract(archive_path, dest_path);
      default:
        p = Promise.reject("Don't know how to extract " + archive_path + " / " + (JSON.stringify(type)));
        p.progress = (function() {
          return p;
        });
        return p;
    }
  };

  module.exports = {
    extract: extract
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/extractor.js.map
