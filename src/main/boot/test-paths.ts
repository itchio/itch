import { app } from "electron";
import { resolve } from "path";
import { mkdirSync } from "original-fs";

const electronLocations = [
  "home",
  "appData",
  "userData",
  "temp",
  "desktop",
  "documents",
  "downloads",
  "music",
  "pictures",
  "videos",
];

// override paths for tests so we know what we're dealing with
export function setup() {
  const base = "./tmp/prefix";

  for (const name of electronLocations) {
    const location = resolve(base, name);
    try {
      mkdirSync(location, { recursive: true });
      app.setPath(name, location);
    } catch (e) {
      console.warn(`Could not set location ${name} to ${location}: ${e.stack}`);
    }
  }
}
