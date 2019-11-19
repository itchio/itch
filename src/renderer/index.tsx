import dump from "common/util/dump";

async function main() {
  console.warn("in main");

  let el = document.createElement("pre");
  document.body.appendChild(el);

  let write = (s: string) {
    el.innerText += `${s}\n`;
  }
  write(`href = ${document.location.href}`);

  write("about to do a forbidden fetch...");
  let res = await fetch("itch://api/cool");
  let payload = await res.json();
  write(`payload = ${dump(payload)}`);
  
  console.warn("main done");
}

console.warn("in index.tsx");

document.addEventListener("DOMContentLoaded", () => {
  console.warn("DOM content loaded!");

  main().catch(e => {
    console.error("Fatal renderer error", e.stack);
    alert(`Fatal renderer error: ${e.stack}`);
  });
});