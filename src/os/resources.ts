// this gives us a unix-style base path
const basePath = "./dist";

/*
 * Resources are files shipped with the app, that are static
 * and don't usually change, unless updated.
 */

function getPath(resourcePath: string) {
  return basePath + "/" + resourcePath;
}

export function getImagePath(path: string): string {
  const resourcePath = "static/images/" + path;
  return getPath(resourcePath);
}

export function getLocalePath(path: string): string {
  const resourcePath = "static/locales/" + path;
  return getPath(resourcePath);
}

export function getLocalesConfigPath(): string {
  let resourcePath = "static/locales.json";
  return getPath(resourcePath);
}

type IInjectName = "itchio" | "game" | "captcha";

export function getInjectPath(name: IInjectName) {
  return getPath(`inject/${name}-init.js`);
}
