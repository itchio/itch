import { Conversation } from "@itchio/butlerd";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { hookLogging } from "common/butlerd/utils";
import { isCancelled } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";

const logger = mainLogger.child(__filename);

// Conversation isn't serializable so it can't live in Redux. Keep just enough
// local state to map cancellation to the live butlerd conversation.
let activeConvo: Conversation | null = null;
let activeJobId: string | null = null;
let pendingCancelJobId: string | null = null;

export default function (watcher: Watcher) {
  watcher.on(actions.startPush, async (store, action) => {
    const { jobId, target, channel, src } = action.payload;

    if (activeJobId) {
      logger.warn("ignoring startPush: another push is already in progress");
      return;
    }
    const profile = store.getState().profile.profile;
    if (!profile) {
      store.dispatch(
        actions.pushFailed({ jobId, channel, message: "Not logged in" })
      );
      return;
    }

    activeJobId = jobId;
    try {
      const res = await mcall(
        messages.WharfPush,
        { profileId: profile.id, src, target, channel },
        (convo) => {
          hookLogging(convo, logger);
          activeConvo = convo;
          if (pendingCancelJobId === jobId) {
            logger.info("cancelling active butler push");
            convo.cancel();
          }
          convo.onNotification(
            messages.WharfPushProgress,
            async ({ progress, eta }) => {
              store.dispatch(
                actions.pushProgress({
                  jobId,
                  // round to 1% — sub-1% deltas don't change the UI
                  progress: Math.round(progress * 100) / 100,
                  label:
                    eta && eta > 0 ? `${Math.round(eta)}s left` : undefined,
                })
              );
            }
          );
        }
      );
      store.dispatch(
        actions.pushDone({ jobId, channel, buildId: res.buildId })
      );
    } catch (e) {
      if (isCancelled(e)) {
        store.dispatch(
          actions.pushFailed({ jobId, channel, message: "Cancelled" })
        );
      } else {
        const message = e instanceof Error ? e.message : String(e);
        store.dispatch(actions.pushFailed({ jobId, channel, message }));
      }
    } finally {
      activeConvo = null;
      activeJobId = null;
      // pendingCancelJobId, when set, always points at the currently-active
      // jobId — cancel only sets it on the active job. Clearing
      // unconditionally is safe.
      pendingCancelJobId = null;
    }
  });

  watcher.on(actions.cancelPush, async (store, action) => {
    const { jobId } = action.payload;
    if (jobId !== activeJobId) {
      return;
    }
    if (activeConvo) {
      logger.info("cancelling active butler push");
      activeConvo.cancel();
    } else {
      pendingCancelJobId = jobId;
    }
  });
}
