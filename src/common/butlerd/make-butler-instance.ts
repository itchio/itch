import { Instance } from "butlerd";
import { butlerDbPath } from "common/util/paths";
import urls from "common/constants/urls";
import ospath from "path";
import { butlerUserAgent } from "common/constants/useragent";
import { RootState } from "common/types";
import env from "common/env";
import { MinimalContext } from "main/context";

interface ButlerInstanceOpts {
  rs?: RootState;
  versionPrefix?: string;
  ctx?: MinimalContext;
}

export async function makeButlerInstance(
  opts: ButlerInstanceOpts
): Promise<Instance> {
  let { versionPrefix } = opts;
  if (!versionPrefix) {
    const { rs } = opts;
    if (!rs) {
      throw new Error(`Either 'versionPrefix' or 'rs' need to be specified`);
    }

    const butlerPkg = rs.broth.packages["butler"];
    if (!butlerPkg) {
      throw new Error(
        `Cannot make butler instance: package 'butler' not registered`
      );
    }

    versionPrefix = butlerPkg.versionPrefix;
    if (!versionPrefix) {
      throw new Error(`Cannot make butler instance: no version prefix`);
    }
  }

  let args = [
    "--dbpath",
    butlerDbPath(),
    "--address",
    urls.itchio,
    "--user-agent",
    butlerUserAgent(),
    "--destiny-pid",
    `${process.pid}`,
  ];

  if (env.development || process.env.BUTLERD_ENABLE_LOGGING) {
    args = [...args, "--log"];
  }

  const instance = new Instance({
    butlerExecutable: ospath.join(versionPrefix, "butler"),
    args,
  });

  const { ctx } = opts;
  if (ctx) {
    ctx.on("abort", () => {
      instance.cancel();
    });
  }

  return instance;
}
