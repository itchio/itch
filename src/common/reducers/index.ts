import allInitial from "common/reducers/all";
import { RootState, Action } from "common/types";

let all = allInitial;

if (module.hot) {
  module.hot.accept("./all", () => {
    console.log(`Refreshing reducers...`);
    all = require("./all").default;
  });
}

export default function reduce(rs: RootState, action: Action<any>) {
  return all(rs, action);
}
