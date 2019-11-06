import env from "common/env";

async function main() {}

main().catch(e => {
  console.error("Fatal error", e);
  alert(`Fatal error: ${e.stack}`);
});
