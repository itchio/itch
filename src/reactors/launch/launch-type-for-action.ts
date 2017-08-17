import butler from "../../util/butler";
import { devNull } from "../../logger";
import Context from "../../context";
import expandManifestPath from "./expand-manifest-path";

export type LaunchType = "native" | "html" | "external" | "native" | "shell";

export default async function launchTypeForAction(
  ctx: Context,
  appPath: string,
  actionPath: string,
): Promise<LaunchType> {
  if (/^https?:/i.test(actionPath)) {
    return "external";
  }

  const fullPath = expandManifestPath(appPath, actionPath);

  const confRes = await butler.configureSingle({
    path: fullPath,
    logger: devNull,
    ctx,
  });
  if (!confRes) {
    return "shell";
  }

  switch (confRes.flavor) {
    case "windows":
    case "windows-script":
    case "macos":
    case "linux":
    case "app-macos":
      return "native";
    case "html":
      return "html";
    default:
      return "shell";
  }
}
