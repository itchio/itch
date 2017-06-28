import Context from "../context";
import { platform } from "../../os";
import spawn from "../../os/spawn";

const self = {
  mimeType: "x-scheme-handler/itchio",

  async query(opts: any, ctx: Context): Promise<number> {
    const logger = opts.logger.child({ name: "xdg-mime" });
    logger.info("querying default handler for itchio:// protocol");
    return await spawn({
      command: "xdg-mime",
      args: ["query", "default", self.mimeType],
      onToken: tok => logger.info("query: " + tok),
      ctx: ctx,
      logger,
    });
  },

  async setDefault(opts: any, ctx: Context): Promise<void> {
    const logger = opts.logger.child({ name: "xdg-mime" });
    logger.info("registering self as default handler for itchio:// protocol");
    return await spawn.assert({
      command: "xdg-mime",
      args: ["default", "io.itch.itch.desktop", self.mimeType],
      onToken: tok => logger.info("set_default: " + tok),
      ctx: ctx,
      logger,
    });
  },

  // lets us handle the itchio:// URL scheme on linux / freedesktop
  async registerIfNeeded(opts: any, ctx: Context): Promise<void> {
    if (platform() !== "linux") {
      return;
    }

    try {
      await self.setDefault(opts, ctx);
      await self.query(opts, ctx);
    } catch (e) {
      const logger = opts.logger.child({ name: "xdg-mime" });
      logger.error(`Couldn't register handler: ${e.stack || e}`);
    }
  },
};

export default self;
