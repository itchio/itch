import { platform } from "../../os";
import spawn from "../../os/spawn";

const self = {
  mimeType: "x-scheme-handler/itchio",

  async query(opts: any): Promise<number> {
    const logger = opts.logger.child({ name: "xdg-mime" });
    logger.info("querying default handler for itchio:// protocol");
    return await spawn({
      command: "xdg-mime",
      args: ["query", "default", self.mimeType],
      onToken: tok => logger.info("query: " + tok),
      logger,
    });
  },

  async setDefault(opts: any): Promise<void> {
    const logger = opts.logger.child({ name: "xdg-mime" });
    logger.info("registering self as default handler for itchio:// protocol");
    return await spawn.assert({
      command: "xdg-mime",
      args: ["default", "io.itch.itch.desktop", self.mimeType],
      onToken: tok => logger.info("set_default: " + tok),
      logger,
    });
  },

  // lets us handle the itchio:// URL scheme on linux / freedesktop
  async registerIfNeeded(opts: any): Promise<void> {
    if (platform() !== "linux") {
      return;
    }

    try {
      await self.setDefault(opts);
      await self.query(opts);
    } catch (e) {
      const logger = opts.logger.child({ name: "xdg-mime" });
      logger.error(`Couldn't register handler: ${e.stack || e}`);
    }
  },
};

export default self;
