import { join } from "path";
import { itchPlatform } from "../../os";

import fnout from "fnout";

const platform = itchPlatform();

export type LaunchType = "native" | "html" | "external" | "native" | "shell";

export default async function launchTypeForAction(
  appPath: string,
  actionPath: string,
): Promise<LaunchType> {
  if (/\.(app|exe|bat|sh)$/i.test(actionPath)) {
    return "native";
  }

  if (/\.html?$/i.test(actionPath)) {
    return "html";
  }

  if (/^https?:/i.test(actionPath)) {
    return "external";
  }

  const fullPath = join(appPath, actionPath);

  // TODO: get rid of that
  // (with butler configure, we don't need that anymore)
  const sniffRes = await fnout.path(fullPath);
  if (
    (sniffRes.linuxExecutable && platform === "linux") ||
    (sniffRes.macExecutable && platform === "osx")
  ) {
    return "native";
  }

  return "shell";
}
