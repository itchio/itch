import Context from "../../context";
import { platform } from "../../os";
import spawn from "../../os/spawn";

import { Logger } from "../../logger";

interface IXdgMimeOpts {
  logger: Logger;
}

const mimeType = "x-scheme-handler/itchio";

export async function query(ctx: Context, opts: IXdgMimeOpts): Promise<number> {
  const logger = opts.logger.child({ name: "xdg-mime" });
  logger.info("querying default handler for itchio:// protocol");
  return await spawn({
    command: "xdg-mime",
    args: ["query", "default", mimeType],
    onToken: tok => logger.info("query: " + tok),
    ctx: ctx,
    logger,
  });
}

export async function setDefault(
  ctx: Context,
  opts: IXdgMimeOpts,
): Promise<void> {
  const logger = opts.logger.child({ name: "xdg-mime" });
  logger.info("registering self as default handler for itchio:// protocol");
  return await spawn.assert({
    command: "xdg-mime",
    args: ["default", "io.itch.itch.desktop", mimeType],
    onToken: tok => logger.info("set_default: " + tok),
    ctx: ctx,
    logger,
  });
}

// lets us handle the itchio:// URL scheme on linux / freedesktop
export async function registerIfNeeded(
  ctx: Context,
  opts: IXdgMimeOpts,
): Promise<void> {
  if (platform() !== "linux") {
    return;
  }

  try {
    await setDefault(ctx, opts);
    await query(ctx, opts);
  } catch (e) {
    const logger = opts.logger.child({ name: "xdg-mime" });
    logger.error(`Couldn't register handler: ${e.stack || e}`);
  }
}
