
import {Store} from "redux";

let store: Store<any>;

if (process.type) {
  store = require(`./${process.type}-store`);
} else {
  store = require("./mock-store");
}

export = store;
