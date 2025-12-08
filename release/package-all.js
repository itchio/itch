//@ts-check

import { parseContext } from "./packaging/context.js";
import { build } from "./packaging/build.js";
import { doPackage } from "./packaging/do-package.js";
import { test } from "./packaging/test.js";

async function main() {
  const cx = await parseContext();

  await build(cx);
  await doPackage(cx);

  if (process.env.SKIP_TESTS) {
    console.log("Skipping integration tests (SKIP_TESTS is set)");
  } else {
    await test(cx);
  }
}

main().catch((e) => {
  throw e;
});
