
import rootLogger from "../../logger";
const logger = rootLogger.child({name: "sandbox/common"});

import { INeed, ICaretakerSet } from "./types";

export async function tendToNeeds(needs: INeed[], caretakers: ICaretakerSet) {
  const errors: Error[] = [];

  for (const need of needs) {
    logger.info(`tending to need ${JSON.stringify(need)}`);
    const caretaker = caretakers[need.type];
    if (!caretaker) {
      errors.push(new Error(`don't know how to fulfill need ${JSON.stringify(need)}`));
    } else {
      try {
        await Promise.resolve(caretaker(need));
      } catch (e) {
        logger.info(`While tending to need ${JSON.stringify(need)}: ${e.stack || e}`);
        errors.push(e);
      }
    }
  }

  return { errors };
}

export default { tendToNeeds };
