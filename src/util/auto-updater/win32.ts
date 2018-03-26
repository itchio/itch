import * as os from "../../os";
import * as shortcut from "../../os/win32/shortcut";

import { AutoUpdaterStart } from "./types";

import { MinimalContext } from "../../context";
import { ItchPromise } from "../itch-promise";

const ctx = new MinimalContext();

async function onInstall() {
  await ItchPromise.all([shortcut.install(ctx)]);
  return true;
}

async function onUpdate() {
  await ItchPromise.all([shortcut.update(ctx)]);
  return true;
}

async function onUninstall() {
  await ItchPromise.all([shortcut.uninstall(ctx)]);
  return true;
}

async function onObsolete() {
  // This is called on the outgoing version of your app before
  // we update to the new version - it's the opposite of --squirrel-update
  return true;
}

const start: AutoUpdaterStart = async function() {
  const squirrelCommand = os.cliArgs()[1];
  switch (squirrelCommand) {
    case "--squirrel-install":
      return await onInstall();
    case "--squirrel-updated":
      return await onUpdate();
    case "--squirrel-uninstall":
      return await onUninstall();
    case "--squirrel-obsolete":
      return await onObsolete();
    default:
    // nothing to do
  }
  return false;
};
export default start;
