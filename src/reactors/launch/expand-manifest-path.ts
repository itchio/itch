import { itchPlatform } from "../../os";

import { join } from "path";

let appExt = "";
switch (itchPlatform()) {
  case "osx":
    appExt = ".app";
    break;
  case "windows":
    appExt = ".exe";
    break;
  default:
  // muffin;
}

export default function expandManifestPath(
  installPath: string,
  manifestPath: string
): string {
  const relativePath = manifestPath.replace(/{{EXT}}/, appExt);
  return join(installPath, relativePath);
}
