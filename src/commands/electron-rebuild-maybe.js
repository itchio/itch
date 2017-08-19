#!/usr/bin/env node

try {
  require("child_process").execSync("electron-rebuild");
} catch (e) {
  console.warn(`Warning: couldn't run electron-rebuild: ${e.stack}`);
}
