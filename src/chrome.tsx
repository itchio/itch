// This file is the entry point for renderer processes

import env from "./env";

if (env.name === "development") {
  require("debug").enable("itch:*");
}

document.addEventListener("DOMContentLoaded", () => {
  const start = require("./chrome-ready").default;
  start();
});
