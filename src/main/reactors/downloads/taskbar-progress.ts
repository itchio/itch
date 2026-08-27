import { RootState } from "common/types";
import { Watcher } from "common/util/watcher";
import { getActiveDownload } from "main/reactors/downloads/getters";
import { getNativeWindow } from "main/reactors/winds";
import { createSelector } from "reselect";

type ProgressBarMode = "none" | "normal" | "error" | "paused";

export default function (watcher: Watcher) {
  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: RootState) => rs.downloads,
        (downloads) => {
          // -1 clears the progress bar. `mode` only has an effect on
          // Windows; macOS renders a plain progress bar on the dock icon.
          let value = -1;
          let mode: ProgressBarMode = "none";

          const active = getActiveDownload(downloads);
          if (active) {
            const progress = downloads.progresses[active.id];
            value = progress ? progress.progress : 0;
            if (active.error) {
              mode = "error";
            } else if (downloads.paused) {
              mode = "paused";
            } else {
              mode = "normal";
            }
          }

          const nativeWindow = getNativeWindow(store.getState(), "root");
          if (nativeWindow && !nativeWindow.isDestroyed()) {
            nativeWindow.setProgressBar(value, { mode });
          }
        }
      ),
  });
}
