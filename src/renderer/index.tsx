import env from "common/env";

async function main() {
  document.write(`Hello from ${env.appName} renderer`);
}

main().catch(e => {
  console.error("Fatal error", e);
  alert(`Fatal error: ${e.stack}`);
});
