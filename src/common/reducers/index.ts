import allInitial from "./all";
import { IRootState, Action } from "common/types/index";

let all = allInitial;

if (module.hot) {
  module.hot.accept("./all", () => {
    console.log(`Refreshing reducers...`);
    all = require("./all").default;
  });
}

export default function reduce(rs: IRootState, action: Action<any>) {
  return all(rs, action);
}
