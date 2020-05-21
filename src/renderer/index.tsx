import React from "react";
import ReactDOM from "react-dom";
import App from "renderer/App";
import { Socket } from "renderer/Socket";

export const socket = new Socket();

document.addEventListener("DOMContentLoaded", () => {
  const appContainer = document.querySelector("#app");
  ReactDOM.render(<App />, appContainer);
});
