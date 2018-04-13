import { getRootState } from "common/util/get-root-state";
import { Instance } from "butlerd";
import { butlerDbPath } from "common/util/paths";
import urls from "common/constants/urls";
import ospath from "path";
import { userAgent } from "common/constants/useragent";
export async function makeButlerInstance(): Promise<Instance> {
  const butlerPkg = getRootState().broth.packages["butler"];
  if (!butlerPkg) {
    throw new Error(
      `Cannot make butler instance: package 'butler' not registered`
    );
  }

  const versionPrefix = butlerPkg.versionPrefix;
  if (!versionPrefix) {
    throw new Error(`Cannot make butler instance: no version prefix`);
  }

  return makeButlerInstanceWithPrefix(versionPrefix);
}

export async function makeButlerInstanceWithPrefix(
  versionPrefix: string
): Promise<Instance> {
  return new Instance({
    butlerExecutable: ospath.join(versionPrefix, "butler"),
    args: [
      "--dbpath",
      butlerDbPath(),
      "--address",
      urls.itchio,
      "--user-agent",
      userAgent(),
    ],
  });
}
