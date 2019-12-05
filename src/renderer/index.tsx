import React from "react";
import ReactDOM from "react-dom";
import App from "renderer/App";

document.addEventListener("DOMContentLoaded", () => {
  const appContainer = document.querySelector("#app");
  ReactDOM.render(<App />, appContainer);
});
