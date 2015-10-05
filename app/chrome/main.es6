
import {render, unmountComponentAtNode} from "react";
import {Layout} from "./components/layout";

document.addEventListener("DOMContentLoaded", () => {
  render(Layout({}), document.body);
});

window.addEventListener("beforeunload", () => {
  unmountComponentAtNode(document.body);
});

window.addEventListener("keydown", (e) => {
  switch (e.keyIdentifier) {
    case "F12":
      var win = window.require("remote").getCurrentWindow();
      win.openDevTools();
      break;
    case "F5":
      if (!e.shiftKey) return;
      window.location.reload();
      break;
  }
});
  

