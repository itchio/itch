import { IStore } from "common/types";
let _store: {
  default: IStore;
};

function getStore(): IStore {
  if (!_store) {
    if (process.type === "browser") {
      _store = require("main/store");
    } else {
      _store = require("renderer/store");
    }
  }
  return _store.default;
}

export const getRootState = () => getStore().getState();
