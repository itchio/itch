import env from "common/env";

if (env.integrationTests) {
  require("main/boot/test-paths").setup();
}

require("common/util/crash-reporter").mount();

if (env.development) {
  Error.stackTraceLimit = Infinity;

  require("bluebird").config({
    longStackTraces: true,
  });

  require("clarify");
}

require("../metal");
