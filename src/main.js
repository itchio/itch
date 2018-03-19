
if (process.env.NODE_ENV !== "test") {
  require("./util/crash-reporter").mount();
}

if (process.env.NODE_ENV === "test") {
  require("./boot/test-paths").setup();
}

if (process.env.NODE_ENV !== "production") {
  require("bluebird").config({
    longStackTraces: true,
  });

  const fs = require("fs");
  require("source-map-support").install({
    retrieveSourceMap: function(source) {
      if (/metal.js$/.test(source)) {
        const map = fs.readFileSync('./dist/metal.map', 'utf8');
        return {
          url: 'metal.ts',
          map: map,
        };
      }
      return null;
    }
  });
}

require("./metal");
