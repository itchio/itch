
import {EventEmitter} from "events";

import * as invariant from "invariant";

import store from "../../store/metal-store";
import * as actions from "../../actions";

import {IStartTaskOpts} from "../../types";

export default async function launch (out: EventEmitter, opts: IStartTaskOpts) {
  const {cave, manifestAction} = opts;
  invariant(cave, "launch/shell has cave");
  invariant(manifestAction, "launch/shell has manifestAction");
  invariant(typeof manifestAction.path === "string", "launch/shell has manifestAction path");

  store.dispatch(actions.navigate(`url/${manifestAction.path}`));
}
