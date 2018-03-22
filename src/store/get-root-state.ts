import { IStore } from "../types";
let _store: {
  default: IStore;
};

function getStore(): IStore {
  if (!_store) {
    if (process.type === "browser") {
      _store = require("./metal-store");
    } else {
      _store = require("./chrome-store");
    }
  }
  return _store.default;
}

export const getRootState = () => getStore().getState();
