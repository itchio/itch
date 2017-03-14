
import sf from "../../util/sf";

import {IConfigureOpts, IConfigureResult} from "./common";

export async function configure (opts: IConfigureOpts, appPath: string): Promise<IConfigureResult> {
  const executables = await sf.glob("**/*.@(exe|bat|jar)", {
    cwd: appPath,
    nocase: true,
  });
  return {executables};
}
