
import {IStore} from "../types";

let store: IStore;

if (process.type) {
  store = require(`./${process.type}-store`).default;
} else {
  store = require("./mock-store").default;
}

export default store;
