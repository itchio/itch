
import {IConfigureOpts, IConfigureResult, fixExecs} from "./common";

const SO_RE = /\.so(\.[^/])*$/i;

export async function configure (opts: IConfigureOpts, appPath: string): Promise<IConfigureResult> {
  const fixResult = await fixExecs(opts, "linuxExecutable", appPath);

  const executables = fixResult.executables.filter((x) => {
    if (SO_RE.test(x)) {
      // ignore libraries
      return false;
    }
    return true;
  });
  return {executables};
}
