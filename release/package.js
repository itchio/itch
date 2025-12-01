//@ts-check

import { doPackage } from "./packaging/do-package.js";
import { parseContext } from "./packaging/context.js";

async function main() {
  const cx = await parseContext();
  await doPackage(cx);
}

main();
