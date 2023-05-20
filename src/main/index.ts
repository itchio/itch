import env from "main/env";

env.setNodeEnv();

if (env.integrationTests) {
  require("main/boot/test-paths").setup();
}

require("main/crash-reporter").mount();

if (process.env.NODE_ENV !== "production") {
  Error.stackTraceLimit = 2000;

  require("bluebird").config({
    longStackTraces: true,
  });

  require("clarify");
}

require("main/main").main();
