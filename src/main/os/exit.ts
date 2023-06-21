import env from "main/env";

export function exit(exitCode: number) {
  if (env.integrationTests) {
    console.log(`this is the magic exit code: ${exitCode}`);
  } else {
    const electron = require("electron");
    const app = electron.app;
    app.exit(exitCode);
  }
}
