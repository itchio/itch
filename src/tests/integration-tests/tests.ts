
import {ISpec} from "./types";

import loginFlow from "./login-flow";
import navigationFlow from "./navigation-flow";

export default function (spec: ISpec) {
  spec("it runs unit tests", async (t) => {
    // muffin
  }, {
    ownExit: true,
    args: ["--run-unit-tests"],
  });

  loginFlow(spec);
  navigationFlow(spec);
}
