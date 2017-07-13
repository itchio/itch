import store from "../../store/metal-store";
import * as actions from "../../actions";

import { ILaunchOpts } from "../../types";
import Context from "../../context";

export default async function launch(ctx: Context, opts: ILaunchOpts) {
  const { manifestAction } = opts;

  store.dispatch(actions.navigate(`url/${manifestAction.path}`));
}
