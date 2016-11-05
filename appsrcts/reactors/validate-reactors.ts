
import * as actionTypes from "../constants/action-types";
import {each} from "underscore";

import {ICombinator} from "./combine";

export default function validateReactors (reactors: ICombinator) {
  each(Object.keys(reactors), (key) => {
    if (key === "_ALL" || key === "__MOUNT") {
      return;
    }
    if (!actionTypes.hasOwnProperty(key)) {
      throw new Error(`trying to react to unknown action type ${key}`);
    }
  });
  return reactors;
}
