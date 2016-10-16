
import sf from "../../util/sf";

import {IConfigureResult} from "./common";

const self = {
  configure: async function (appPath: string): Promise<IConfigureResult> {
    const executables = await sf.glob("**/*.@(exe|bat|jar)", {
      cwd: appPath,
      nocase: true,
    });
    return {executables};
  },
};

export default self;
