import * as ospath from "path";

import spawn from "../spawn";

import rootLogger, { devNull } from "../../logger";
const logger = rootLogger.child({ name: "registry" });

import Context from "../../context";

let base = "HKCU\\Software\\Classes\\itchio";

let systemRoot = process.env.SystemRoot || "missing-system-root";
let system32Path = ospath.join(systemRoot, "System32");
let regPath = ospath.join(system32Path, "reg.exe");

interface IQueryOpts {
  /** if true, don't log output */
  quiet?: boolean;
}

export async function regQuery(
  ctx: Context,
  key: string,
  queryOpts: IQueryOpts = {}
): Promise<void> {
  await spawn.assert({
    command: regPath,
    args: ["query", key, "/s"],
    onToken: queryOpts.quiet ? null : tok => logger.info("query: " + tok),
    ctx,
    logger: devNull,
  });
}

export async function regAddDefault(
  ctx: Context,
  key: string,
  value: string
): Promise<void> {
  await spawn.assert({
    command: regPath,
    args: ["add", key, "/ve", "/d", value, "/f"],
    ctx,
    logger: devNull,
  });
}

export async function regAddEmpty(
  ctx: Context,
  key: string,
  value: string
): Promise<void> {
  await spawn.assert({
    command: regPath,
    args: ["add", key, "/v", value, "/f"],
    ctx,
    logger: devNull,
  });
}

export async function regDeleteAll(ctx: Context, key: string): Promise<void> {
  await spawn.assert({
    command: regPath,
    args: ["delete", key, "/f"],
    ctx,
    logger: devNull,
  });
}

export async function install(ctx: Context): Promise<void> {
  try {
    await regAddDefault(ctx, base, "URL:itch.io protocol");
    await regAddEmpty(ctx, base, "URL protocol");
    await regAddDefault(ctx, `${base}\\DefaultIcon`, "itch.exe");
    await regAddDefault(
      ctx,
      `${base}\\Shell\\Open\\Command`,
      `"${process.execPath}" "%1"`
    );
  } catch (e) {
    logger.warn(
      `Could not register itchio:// as default protocol handler: ${e.stack ||
        e}`
    );
  }
}

export async function update(ctx: Context): Promise<void> {
  // TODO: maybe don't go writing to the registry if everything's
  // there, mhhhh ?
  await install(ctx);
}

export async function uninstall(ctx: Context): Promise<void> {
  try {
    await regDeleteAll(ctx, base);
  } catch (e) {
    logger.warn(
      `Could not register itchio:// as default protocol handler: ${e.stack ||
        e}`
    );
  }
}
