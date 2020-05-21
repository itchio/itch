// @ts-check
"use strict";

(function () {
  let ipcRenderer = require("electron").ipcRenderer;

  /** @type {typeof window & {sendToMain?: (payload: string) => void}} */
  let extendedWindow = window;

  /**
   * @param {string} payload
   * @returns {void}
   */
  function sendToMain(payload) {
    ipcRenderer.send("from-renderer", payload);
  }
  extendedWindow.sendToMain = sendToMain;

  /**
   * @param {import("electron").IpcRendererEvent} ev
   * @param {string} payload
   */
  function onFromMain(ev, payload) {
    let cev = new CustomEvent("from-main", { detail: payload });
    window.dispatchEvent(cev);
  }
  ipcRenderer.on("from-main", onFromMain);

  console.log(
    `Set up IPC bridge for webcontents ${
      require("electron").remote.getCurrentWebContents().id
    }`
  );
})();
