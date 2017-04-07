
import {resolve} from "path";

export function getImagePath (path: string): string {
  // tslint:disable:no-console
  console.log(`get-resource-path: called with ${path}`);
  let resourcePath = require("../static/images/" + path);
  console.log(`get-resource-path: wepback would have us believe resource path is ${resourcePath}`);
  console.log(`tray: __dirname  = ${__dirname}`);
  console.log(`tray: __filename = ${__filename}`);
  const result = resolve(__dirname, resourcePath);
  console.log(`tray: final iconPath is ${result}`);
  return result;
}
