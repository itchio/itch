
import * as bluebird from "bluebird";

import os from "../os";
import registry from "../registry";
import shortcut from "../shortcut";

const self = {
  onInstall: async () => {
    await bluebird.all([
      registry.install(),
      shortcut.install(),
    ]);
    return true;
  },

  onUpdate: async () => {
    await bluebird.all([
      registry.update(),
      shortcut.update(),
    ]);
    return true;
  },

  onUninstall: async () => {
    await bluebird.all([
      registry.uninstall(),
      shortcut.uninstall(),
    ]);
    return true;
  },

  onObsolete: async () => {
    // This is called on the outgoing version of your app before
    // we update to the new version - it's the opposite of --squirrel-update
    return true;
  },

  start: async (): Promise<boolean> => {
    const squirrelCommand = os.cliArgs()[1];
    switch (squirrelCommand) {
      case "--squirrel-install":
        return await self.onInstall();
      case "--squirrel-updated":
        return await self.onUpdate();
      case "--squirrel-uninstall":
        return await self.onUninstall();
      case "--squirrel-obsolete":
        return await self.onObsolete();
      default:
        // nothing to do
    }
    return false;
  },
};

export default self;
