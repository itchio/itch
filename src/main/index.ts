import env from "../env";

if (env.integrationTests) {
  require("../boot/test-paths").setup();
}

require("../util/crash-reporter").mount();

if (env.development) {
  Error.stackTraceLimit = Infinity;

  require("bluebird").config({
    longStackTraces: true,
  });

  require("clarify");
}

require("../metal");
