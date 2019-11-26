import env from "common/env";

export function exit(exitCode: number) {
  if (env.integrationTests) {
    console.log(`this is the magic exit code: ${exitCode}`);
  } else {
    const electron = require("electron");
    const app = electron.app || electron.remote.app;
    app.exit(exitCode);
  }
}
