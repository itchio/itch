import { getRootState } from "../store/get-root-state";
import { Instance } from "butlerd";
import { butlerDbPath } from "../os/paths";
import urls from "../constants/urls";
import ospath from "path";

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
    args: ["--dbpath", butlerDbPath(), "--address", urls.itchio],
  });
}
