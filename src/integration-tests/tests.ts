import { IIntegrationTest } from "./types";

import loginFlow from "./login-flow";
import navigationFlow from "./navigation-flow";

export default async function(t: IIntegrationTest) {
  await loginFlow(t);
  await navigationFlow(t);
}
