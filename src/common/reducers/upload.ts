import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import { PreviewState, PushJob, UploadState } from "common/types";

const initialState: UploadState = {
  jobs: {},
  jobOrder: [],
};

// Each selector below is memoized on (jobs, jobOrder) reference equality.
// The reducer always returns a new state.jobs / state.jobOrder when either
// changes, so ref-equality is sufficient to detect "nothing relevant
// changed." This keeps connect() from re-rendering UploadPage on every
// unrelated upload-state tick (e.g. preview state churn).

const EMPTY_PUSH_JOBS: readonly PushJob[] = [];
const EMPTY_BUILD_IDS: readonly number[] = [];
const EMPTY_PUSH_JOBS_BY_ID: { readonly [buildId: number]: PushJob } = {};
const MAX_STARTED_BUILD_IDS = 100;

function memoizeOnJobs<T>(
  compute: (s: UploadState) => T
): (s: UploadState) => T {
  let lastJobs: UploadState["jobs"] | undefined;
  let lastOrder: UploadState["jobOrder"] | undefined;
  let lastResult: T;
  return (s) => {
    if (s.jobs === lastJobs && s.jobOrder === lastOrder) {
      return lastResult;
    }
    lastJobs = s.jobs;
    lastOrder = s.jobOrder;
    lastResult = compute(s);
    return lastResult;
  };
}

/**
 * Push jobs that may need a synthetic top-row — i.e. anything that hasn't
 * cleanly handed off to the server. Covers:
 *   - jobs without a buildId (CreateBuild hasn't returned, or errored
 *     before it),
 *   - jobs still uploading (the list refetch with startedBuildIds may
 *     not have landed yet),
 *   - terminal jobs (failed / cancelled) whose server build the API
 *     wouldn't surface on the active tab (e.g. push died mid-upload, the
 *     server still has the build in "started" state, but the user is on
 *     the Failed tab where started is filtered out).
 *
 * UploadPage dedupes against the current list so this never shadows a
 * real row, and tab-filters by the job's local status so e.g. an
 * in-flight pushing job doesn't leak onto the Failed tab.
 */
export const selectRowlessPushJobs = memoizeOnJobs<PushJob[]>((s) => {
  const out = s.jobOrder
    .map((id) => s.jobs[id])
    .filter((j): j is PushJob => !!j && j.status !== "processing");
  return out.length === 0 ? (EMPTY_PUSH_JOBS as PushJob[]) : out;
});

/**
 * Build IDs of all push jobs we know about, for opting them into
 * Publish.ListBuilds via startedBuildIds. Capped at 100 (the API's limit)
 * — keeps the newest by jobOrder position, drops the oldest excess.
 */
export const selectPushJobBuildIds = memoizeOnJobs<number[]>((s) => {
  const out: number[] = [];
  for (const id of s.jobOrder) {
    const j = s.jobs[id];
    if (j?.buildId) out.push(j.buildId);
  }
  if (out.length === 0) return EMPTY_BUILD_IDS as number[];
  if (out.length > MAX_STARTED_BUILD_IDS) {
    out.length = MAX_STARTED_BUILD_IDS;
  }
  return out;
});

/**
 * Push jobs keyed by their server-side buildId, for overlaying live push
 * progress / terminal state onto the matching server build row.
 */
export const selectPushJobsByBuildId = memoizeOnJobs<{
  [buildId: number]: PushJob;
}>((s) => {
  const out: { [buildId: number]: PushJob } = {};
  for (const id of s.jobOrder) {
    const j = s.jobs[id];
    if (j?.buildId) out[j.buildId] = j;
  }
  if (Object.keys(out).length === 0) {
    return EMPTY_PUSH_JOBS_BY_ID as { [buildId: number]: PushJob };
  }
  return out;
});

/**
 * True iff any push is currently transferring data — used by the sidebar's
 * activity indicator. Excludes failed/cancelled jobs that are sticking
 * around just to surface their error.
 */
export function selectHasInFlightPush(s: UploadState): boolean {
  for (const id of s.jobOrder) {
    const j = s.jobs[id];
    if (j && j.status === "pushing") return true;
  }
  return false;
}

// History cap — long-running sessions push many builds; we never need more
// than the most recent few in jobs/jobOrder.
const MAX_JOB_HISTORY = 50;

function pruneJobHistory(state: UploadState): UploadState {
  if (state.jobOrder.length <= MAX_JOB_HISTORY) {
    return state;
  }
  const kept = state.jobOrder.slice(0, MAX_JOB_HISTORY);
  // Always keep jobs that are still pushing, even if they've fallen off
  // the recency window — losing one out from under a running reactor would
  // strand the conversation.
  const keepIds = new Set(kept);
  for (const id of state.jobOrder) {
    const j = state.jobs[id];
    if (j && j.status === "pushing") {
      keepIds.add(id);
    }
  }
  const orderedKept = state.jobOrder.filter((id) => keepIds.has(id));
  const jobs: { [id: string]: PushJob } = {};
  for (const id of orderedKept) {
    const job = state.jobs[id];
    if (job) jobs[id] = job;
  }
  return { ...state, jobs, jobOrder: orderedKept };
}

function updateJob(
  state: UploadState,
  jobId: string,
  patch: Partial<PushJob>
): UploadState {
  const job = state.jobs[jobId];
  if (!job) {
    return state;
  }
  return {
    ...state,
    jobs: {
      ...state.jobs,
      [jobId]: {
        ...job,
        ...patch,
      },
    },
  };
}

export default reducer<UploadState>(initialState, (on) => {
  on(actions.startPush, (state, action) => {
    const {
      jobId,
      createdAt,
      gameId,
      target,
      channel,
      src,
      gameTitle,
      gameCoverUrl,
      gameStillCoverUrl,
    } = action.payload;

    const job: PushJob = {
      id: jobId,
      gameId,
      target,
      channel,
      src,
      gameTitle,
      gameCoverUrl,
      gameStillCoverUrl,
      status: "pushing",
      progress: 0,
      createdAt,
      updatedAt: createdAt,
    };

    return pruneJobHistory({
      jobs: {
        ...state.jobs,
        [jobId]: job,
      },
      jobOrder: [jobId, ...state.jobOrder],
    });
  });

  on(actions.pushBuildAssigned, (state, action) => {
    const { jobId, buildId } = action.payload;
    const job = state.jobs[jobId];
    if (!job || job.status !== "pushing" || job.buildId === buildId) {
      return state;
    }
    return updateJob(state, jobId, { buildId, updatedAt: Date.now() });
  });

  on(actions.pushProgress, (state, action) => {
    const {
      jobId,
      progress,
      eta,
      bps,
      readBytes,
      totalBytes,
      uploadedBytes,
      patchBytes,
      label,
    } = action.payload;
    const job = state.jobs[jobId];
    if (!job || job.status !== "pushing") {
      return state;
    }
    if (
      job.progress === progress &&
      job.label === label &&
      job.eta === eta &&
      job.bps === bps &&
      job.readBytes === readBytes &&
      job.totalBytes === totalBytes &&
      job.uploadedBytes === uploadedBytes &&
      job.patchBytes === patchBytes
    ) {
      return state;
    }
    return updateJob(state, jobId, {
      progress,
      eta,
      bps,
      readBytes,
      totalBytes,
      uploadedBytes,
      patchBytes,
      label,
      updatedAt: Date.now(),
    });
  });

  on(actions.pushDone, (state, action) => {
    const { jobId, buildId } = action.payload;
    const job = state.jobs[jobId];
    if (!job) {
      return state;
    }
    if (job.status === "cancelled") {
      return state;
    }
    return updateJob(state, jobId, {
      buildId,
      status: "processing",
      progress: 1,
      label: undefined,
      updatedAt: Date.now(),
    });
  });

  on(actions.pushFailed, (state, action) => {
    const { jobId, message } = action.payload;
    const job = state.jobs[jobId];
    if (!job) {
      return state;
    }
    if (job.status === "cancelled") {
      return state;
    }
    return updateJob(state, jobId, {
      status: "failed",
      label: undefined,
      message,
      updatedAt: Date.now(),
    });
  });

  on(actions.cancelPush, (state, action) => {
    const { jobId } = action.payload;
    const job = state.jobs[jobId];
    if (!job || job.status !== "pushing") {
      return state;
    }
    return updateJob(state, jobId, {
      status: "cancelled",
      label: undefined,
      message: "Cancelled",
      updatedAt: Date.now(),
    });
  });

  on(actions.dismissPushJob, (state, action) => {
    const { jobId } = action.payload;
    const job = state.jobs[jobId];
    if (!job) {
      return state;
    }
    // Only terminal jobs can be dismissed — dropping an in-flight job from
    // state would strand its butler conversation in the reactor.
    if (job.status !== "failed" && job.status !== "cancelled") {
      return state;
    }
    const { [jobId]: _dropped, ...remaining } = state.jobs;
    return {
      ...state,
      jobs: remaining,
      jobOrder: state.jobOrder.filter((id) => id !== jobId),
    };
  });

  on(actions.startPreview, (state, action) => {
    const { id, target, channel, src } = action.payload;
    const preview: PreviewState = {
      id,
      target,
      channel,
      src,
      status: "running",
      progress: 0,
      startedAt: Date.now(),
    };
    return {
      ...state,
      currentPreview: preview,
    };
  });

  on(actions.previewProgress, (state, action) => {
    const { id, progress, eta, bps, readBytes, totalBytes } = action.payload;
    const cur = state.currentPreview;
    if (!cur || cur.id !== id || cur.status !== "running") {
      return state;
    }
    if (
      cur.progress === progress &&
      cur.eta === eta &&
      cur.bps === bps &&
      cur.readBytes === readBytes &&
      cur.totalBytes === totalBytes
    ) {
      return state;
    }
    return {
      ...state,
      currentPreview: {
        ...cur,
        progress,
        eta,
        bps,
        readBytes,
        totalBytes,
      },
    };
  });

  on(actions.previewDone, (state, action) => {
    const {
      id,
      hasParent,
      parentBuildId,
      sourceSize,
      comparison,
      topChangedFiles,
    } = action.payload;
    const cur = state.currentPreview;
    if (!cur || cur.id !== id) {
      return state;
    }
    return {
      ...state,
      currentPreview: {
        ...cur,
        status: "done",
        progress: 1,
        hasParent,
        parentBuildId,
        sourceSize,
        comparison,
        topChangedFiles,
        finishedAt: Date.now(),
      },
    };
  });

  on(actions.previewFailed, (state, action) => {
    const { id, message } = action.payload;
    const cur = state.currentPreview;
    if (!cur || cur.id !== id) {
      return state;
    }
    return {
      ...state,
      currentPreview: {
        ...cur,
        status: message === "Cancelled" ? "cancelled" : "failed",
        message,
        finishedAt: Date.now(),
      },
    };
  });

  on(actions.clearPreview, (state) => {
    if (!state.currentPreview) {
      return state;
    }
    const { currentPreview, ...rest } = state;
    return rest;
  });

  on(actions.loggedOut, () => initialState);
});
