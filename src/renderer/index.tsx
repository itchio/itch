import dump from "common/util/dump";

async function main() {
  let el = document.createElement("pre");
  document.body.appendChild(el);

  let write = (s: string) {
    el.innerText += `${s}\n`;
  }
  write(`Hello from renderer`);

  write("about to do a forbidden fetch...");
  let res = await fetch("itch://api/cool");
  let payload = await res.json();
  write(`payload = ${dump(payload)}`);
}

main().catch(e => {
  console.error("Fatal renderer error", e.stack);
  alert(`Fatal renderer error: ${e.stack}`);
});
