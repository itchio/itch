
import polyfill from "babel/polyfill";
import React from "react";
import {Layout} from "./components/layout";

document.addEventListener("DOMContentLoaded", () => {
  React.render(<Layout/>, document.body);
});

window.addEventListener("beforeunload", () => {
  React.unmountComponentAtNode(document.body);
});

window.addEventListener("keydown", (e) => {
  switch (e.keyIdentifier) {
    case "F12":
      let win = window.require("remote").getCurrentWindow();
      win.openDevTools();
      break;
    case "F5":
      if (!e.shiftKey) return;
      window.location.reload();
      break;
  }
});
  

