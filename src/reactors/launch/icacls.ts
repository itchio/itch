import spawn from "../../os/spawn";
import { Logger, devNull } from "../../logger";
import Context from "../../context";

interface IIcaclsOptions {
  path: string;
  sid: string;
  logger: Logger;
}

async function icacls(
  ctx: Context,
  opts: IIcaclsOptions,
  reason: string,
  args: string[],
) {
  const logger = opts.logger.child({ name: "icacls" });

  await spawn.assert({
    command: "icacls",
    args,
    onToken: tok => {
      logger.info(`[${reason} out] ${tok}`);
    },
    onErrToken: tok => {
      logger.info(`[${reason} err] ${tok}`);
    },
    ctx,
    logger: devNull,
  });
}

export async function shareWith(ctx: Context, opts: IIcaclsOptions) {
  // acl cleanup is needed because previous instances of the win32 sandbox
  // would deny all access to all files recursively (and individually) after
  // the sandbox ran, instead of removing ACL entries
  await icacls(ctx, opts, "cleanup", [
    opts.path,
    "/remove:d", // remove any deny (:d) ACL entries for sid
    opts.sid,
    "/T", // apply recursively
    "/Q", // don't print success messages, only errors
    "/c", // continue on error
  ]);

  // We only need to grant access to the folder, thanks to inheritance:
  //   F = full access (list, read, write, create, etc.)
  //   (OI) = object inheritance (applies to all files)
  //   (CI) = container inheritance (applies to all subfolders)
  // Note: we don't need "/T", since inheritance recursive by default,
  // as long as we don't specify (NP)
  const perm = "(OI)(CI)F";

  await icacls(ctx, opts, "grant", [
    opts.path,
    "/grant",
    `${opts.sid}:${perm}`,
    "/Q", // don't print success messages, only errors
  ]);
}

export async function unshareWith(ctx: Context, opts: IIcaclsOptions) {
  // this undoes what the new sandbox does (inherited grant on root folder)
  await icacls(ctx, opts, "cleanup", [
    opts.path,
    "/remove", // remove any deny (:d) ACL entries for sid
    opts.sid,
    "/Q", // don't print success messages, only errors
  ]);
}
