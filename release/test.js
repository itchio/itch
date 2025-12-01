//@ts-check

import { test } from "./packaging/test.js";
import { parseContext } from "./packaging/context.js";

async function main() {
  const cx = await parseContext();
  await test(cx);
}

main();
