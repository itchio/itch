#!/usr/bin/env node

// Only run electron-rebuild if electron is installed
try {
  require("fs").statSync("./node_modules/electron/package.json");
} catch (e) {
  if (e.code === "ENOENT") {
    console.log(`No devDependencies, not running electron-rebuild`);
    process.exit(0);
  } else {
    console.error(`While deciding whether or not to run electron-rebuild: ${e.stack}`);
    process.exit(1);
  }
}

require("child_process").execSync("electron-rebuild");
