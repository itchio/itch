async function main() {
  document.write(`Hello from renderer`);

  console.log("about to do a forbidden fetch");
  let res = await fetch("itch://api/cool");
  let payload = await res.json();
  console.log(`payload = `, payload);
}

main().catch(e => {
  console.error("Fatal renderer error", e.stack);
  alert(`Fatal renderer error: ${e.stack}`);
});
