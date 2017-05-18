// This file is the entry point for renderer processes

document.addEventListener("DOMContentLoaded", () => {
  const start = require("./chrome-ready").default;
  start();
});
