//@ts-check

import { build } from "./packaging/build.js";
import { parseContext } from "./packaging/context.js";

async function main() {
  const cx = await parseContext();
  await build(cx);
}

main();
