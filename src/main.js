
if (process.env.NODE_ENV !== "test") {
  require("./util/crash-reporter").mount();
}

if (process.env.NODE_ENV === "test") {
  require("./boot/test-paths").setup();
}

if (process.env.NODE_ENV !== "production") {
  Error.stackTraceLimit = Infinity;

  require("bluebird").config({
    longStackTraces: true,
  });

  require("clarify");

  if (process.env.NO_SOURCE_MAPS !== "1") {
    const fs = require("fs");
    require("source-map-support").install({
      retrieveSourceMap: function(source) {
        if (/main.js$/.test(source)) {
          const map = fs.readFileSync('./app/main.map', 'utf8');
          return {
            url: 'main.ts',
            map: map,
          };
        }
        return null;
      }
    });
  }
}

require("./metal");
