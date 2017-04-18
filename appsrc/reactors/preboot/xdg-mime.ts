
import os from "../../util/os";
import spawn from "../../util/spawn";
import mklog from "../../util/log";
const log = mklog("xdg-mime");

const self = {
  mimeType: "x-scheme-handler/itchio",

  async query (opts: any): Promise<number> {
    let logger = opts.logger;
    log(opts, "querying default handler for itchio:// protocol");
    return await spawn({
      command: "xdg-mime",
      args: ["query", "default", self.mimeType],
      onToken: (tok) => log(opts, "query: " + tok),
      logger,
    });
  },

  async setDefault (opts: any): Promise<void> {
    let logger = opts.logger;
    log(opts, "registering self as default handler for itchio:// protocol");
    return await spawn.assert({
      command: "xdg-mime",
      args: ["default", "io.itch.itch.desktop", self.mimeType],
      onToken: (tok) => log(opts, "set_default: " + tok),
      logger,
    });
  },

  // lets us handle the itchio:// URL scheme on linux / freedesktop
  async registerIfNeeded (opts: any): Promise<void> {
    if (os.platform() !== "linux") {
      return;
    }

    try {
      await self.setDefault(opts);
      await self.query(opts);
    } catch (e) {
      log(opts, `Couldn't register xdg mime-type handler: ${e.stack || e}`);
    }
  },

};

export default self;
