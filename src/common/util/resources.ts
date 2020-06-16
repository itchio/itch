import { join } from "path";
import { getAppPath } from "common/helpers/app";
import env from "common/env";

let absoluteDistPath = join(getAppPath(), "lib", env.name);
let absoluteMainDistPath = join(absoluteDistPath, "main");
let absoluteRendererDistPath = join(absoluteDistPath, "renderer");
let absoluteNodeModulesPath = join(getAppPath(), "node_modules");

/*
 * Resources are files shipped with the app, that are static
 * and don't usually change, unless updated.
 */

type InjectName = "itchio" | "game" | "captcha";

export function getInjectPath(name: InjectName): string {
  return join(absoluteMainDistPath, `inject-${name}.bundle.js`);
}

export function getRendererFilePath(name: string): string {
  return join(absoluteRendererDistPath, name);
}

export function getRendererDistPath(): string {
  return absoluteRendererDistPath;
}

export function getDistPath(): string {
  return absoluteDistPath;
}

export function getNodeModulesPath(): string {
  return absoluteNodeModulesPath;
}
