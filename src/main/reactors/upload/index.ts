import { Conversation } from "@itchio/butlerd";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { hookLogging } from "common/butlerd/utils";
import { MAX_RECENT_PUSH_FOLDERS } from "common/reducers/preferences";
import { isCancelled, RecentPushFolder } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";

const logger = mainLogger.child(__filename);

// Conversations aren't serializable so they can't live in Redux. Track them
// by jobId here so cancellation can target a specific in-flight push when
// multiple are running concurrently.
const activeConvos = new Map<string, Conversation>();
// A cancel request that arrives before its convo has been registered is
// stashed here; the startPush handler checks this on convo creation.
const pendingCancels = new Set<string>();

// Preview gets its own tracking maps so a push and a preview with colliding
// uuids can't cross-cancel. Only one preview is meaningful at a time but we
// still key by id for late-arriving cancels against a replaced run.
const activePreviewConvos = new Map<string, Conversation>();
const pendingPreviewCancels = new Set<string>();

export default function (watcher: Watcher) {
  watcher.on(actions.startPush, async (store, action) => {
    const { jobId, target, channel, src, gameId } = action.payload;

    const profile = store.getState().profile.profile;
    if (!profile) {
      store.dispatch(
        actions.pushFailed({ jobId, channel, message: "Not logged in" })
      );
      return;
    }

    // Bump-or-insert this src into recentPushFolders so the modal's
    // Recent list survives across restarts.
    const prev = store.getState().preferences.recentPushFolders ?? [];
    const next: RecentPushFolder[] = [
      { path: src, lastUsedAt: Date.now(), gameId },
      ...prev.filter((f) => f.path !== src),
    ].slice(0, MAX_RECENT_PUSH_FOLDERS);
    store.dispatch(actions.updatePreferences({ recentPushFolders: next }));

    try {
      const res = await mcall(
        messages.PublishPush,
        { profileId: profile.id, src, target, channel },
        (convo) => {
          hookLogging(convo, logger);
          activeConvos.set(jobId, convo);
          if (pendingCancels.has(jobId)) {
            pendingCancels.delete(jobId);
            logger.info(`cancelling butler push ${jobId} (pre-registered)`);
            convo.cancel();
          }
          convo.onNotification(
            messages.PublishPushBuildAssigned,
            async ({ buildId }) => {
              store.dispatch(actions.pushBuildAssigned({ jobId, buildId }));
            }
          );
          convo.onNotification(
            messages.PublishPushProgress,
            async ({
              progress,
              eta,
              bps,
              readBytes,
              totalBytes,
              uploadedBytes,
              patchBytes,
            }) => {
              store.dispatch(
                actions.pushProgress({
                  jobId,
                  // round to 1% — sub-1% deltas don't change the UI
                  progress: Math.round(progress * 100) / 100,
                  eta,
                  bps,
                  readBytes,
                  totalBytes,
                  uploadedBytes,
                  patchBytes,
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
      activeConvos.delete(jobId);
      pendingCancels.delete(jobId);
    }
  });

  watcher.on(actions.cancelPush, async (store, action) => {
    const { jobId } = action.payload;
    const convo = activeConvos.get(jobId);
    if (convo) {
      logger.info(`cancelling butler push ${jobId}`);
      convo.cancel();
    } else {
      // The startPush handler hasn't registered its convo yet; mark for
      // cancellation when it does.
      pendingCancels.add(jobId);
    }
  });

  watcher.on(actions.startPreview, async (store, action) => {
    const { id, target, channel, src } = action.payload;

    const profile = store.getState().profile.profile;
    if (!profile) {
      store.dispatch(actions.previewFailed({ id, message: "Not logged in" }));
      return;
    }

    try {
      const res = await mcall(
        messages.PublishPushPreview,
        { profileId: profile.id, src, target, channel },
        (convo) => {
          hookLogging(convo, logger);
          activePreviewConvos.set(id, convo);
          if (pendingPreviewCancels.has(id)) {
            pendingPreviewCancels.delete(id);
            logger.info(
              `cancelling butler push-preview ${id} (pre-registered)`
            );
            convo.cancel();
          }
          convo.onNotification(
            messages.PublishPushProgress,
            async ({ progress, eta, bps, readBytes, totalBytes }) => {
              store.dispatch(
                actions.previewProgress({
                  id,
                  // round to 1% — sub-1% deltas don't change the UI
                  progress: Math.round(progress * 100) / 100,
                  eta,
                  bps,
                  readBytes,
                  totalBytes,
                })
              );
            }
          );
        }
      );
      store.dispatch(
        actions.previewDone({
          id,
          hasParent: res.hasParent,
          parentBuildId: res.parentBuildId,
          sourceSize: res.sourceSize,
          comparison: res.comparison,
          topChangedFiles: res.topChangedFiles,
        })
      );
    } catch (e) {
      if (isCancelled(e)) {
        store.dispatch(actions.previewFailed({ id, message: "Cancelled" }));
      } else {
        const message = e instanceof Error ? e.message : String(e);
        store.dispatch(actions.previewFailed({ id, message }));
      }
    } finally {
      activePreviewConvos.delete(id);
      pendingPreviewCancels.delete(id);
    }
  });

  watcher.on(actions.cancelPreview, async (_store, action) => {
    const { id } = action.payload;
    const convo = activePreviewConvos.get(id);
    if (convo) {
      logger.info(`cancelling butler push-preview ${id}`);
      convo.cancel();
    } else {
      pendingPreviewCancels.add(id);
    }
  });
}
