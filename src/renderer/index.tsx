import dump from "common/util/dump";

async function main() {
  let wv = document.createElement("webview");
  wv.style.width = "800px";
  wv.style.height = "600px";
  wv.src = "https://itch.io";
  document.body.appendChild(wv);

  let back = document.createElement("span");
  back.innerText = "[ back ]";
  back.onclick = () => { wv.goBack() };
  document.body.appendChild(back);

  let forward = document.createElement("span");
  forward.innerText = "[ forward] ";
  forward.onclick = () => { wv.goForward() };
  document.body.appendChild(forward);

  let el = document.createElement("pre");
  document.body.appendChild(el);

  let write = (s: string) {
    el.innerHTML += `${s}\n`;
  }
  write(`href = ${document.location.href}`);

  write("about to do a forbidden fetch...");
  let res = await fetch("itch://api/cool");
  let payload = await res.json();
  write(`payload = ${dump(payload)}`);

  for (let i = 0; i < 150; i++) {
    write(`here's <a href="itch://games/3">item ${i}</a>`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  main().catch(e => {
    console.error("Fatal renderer error", e.stack);
    alert(`Fatal renderer error: ${e.stack}`);
  });
});