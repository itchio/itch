
import {IConfigureOpts, IConfigureResult, fixExecs} from "./common";

const SO_RE = /\.so(\.[^/])*$/i;

export async function configure (opts: IConfigureOpts, appPath: string): Promise<IConfigureResult> {
  const executablesAndLibraries = await fixExecs(opts, "linuxExecutable", appPath);

  const executables = executablesAndLibraries.filter((x) => {
    if (SO_RE.test(x)) {
      // ignore libraries
      return false;
    }
    return true;
  });
  return {executables};
}
