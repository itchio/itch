
import {resolve} from "path";

export function getImagePath (path: string): string {
  // tslint:disable:no-console
  console.log(`get-image-path: called with ${path}`);
  let resourcePath = require("../static/images/" + path);
  console.log(`get-image-path: wepback says path is ${resourcePath}`);
  console.log(`get-image-path: __dirname  = ${__dirname}`);
  console.log(`get-image-path: __filename = ${__filename}`);
  const result = resolve(__dirname, resourcePath);
  console.log(`get-image-path: final iconPath is ${result}`);
  return result;
}

export function getLocalePath (path: string): string {
  // tslint:disable:no-console
  console.log(`get-locale-path: called with ${path}`);
  let resourcePath = require("../static/locales/" + path);
  console.log(`get-locale-path: wepback says path is ${resourcePath}`);
  console.log(`get-locale-path: __dirname  = ${__dirname}`);
  console.log(`get-locale-path: __filename = ${__filename}`);
  const result = resolve(__dirname, resourcePath);
  console.log(`get-locale-path: final path is ${result}`);
  return result;
}

export function getLocalesConfigPath (): string {
  // tslint:disable:no-console
  let resourcePath = require("../static/locales.json");
  console.log(`get-locales-path: wepback says path is ${resourcePath}`);
  console.log(`get-locales-path: __dirname  = ${__dirname}`);
  console.log(`get-locales-path: __filename = ${__filename}`);
  const result = resolve(__dirname, resourcePath);
  console.log(`get-locales-path: final path is ${result}`);
  return result;
}
