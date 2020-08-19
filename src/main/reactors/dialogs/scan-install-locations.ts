import { actions } from "common/actions";
import { Watcher } from "common/util/watcher";

export default function (watcher: Watcher) {
  watcher.on(actions.scanInstallLocations, async (store, action) => {
    store.dispatch(
      actions.openWind({
        initialURL: "itch://scan-install-locations",
        role: "secondary",
      })
    );
  });
}
