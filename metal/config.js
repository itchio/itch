(function() {
  var nconf, save;

  nconf = require("nconf");

  nconf.file({
    file: "./config.json"
  });

  save = function() {
    return nconf.save(function(err) {
      if (err) {
        return console.log("Could not save config: " + err);
      }
    });
  };

  module.exports = {
    get: function(key) {
      return nconf.get(key);
    },
    set: function(key, value) {
      nconf.set(key, value);
      return save();
    },
    clear: function(key) {
      nconf.clear(key);
      return save();
    }
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/config.js.map
