import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import { PreviewState, PushJob, UploadState } from "common/types";

const initialState: UploadState = {
  jobs: {},
  jobOrder: [],
};

/**
 * Returns every push job whose status is "pushing" — these are the
 * synthetic rows the dashboard pins to the top of the list. Once a job
 * transitions to processing/failed/cancelled it stops appearing here.
 */
export function selectActivePushJobs(s: UploadState): PushJob[] {
  return s.jobOrder
    .map((id) => s.jobs[id])
    .filter((j): j is PushJob => !!j && j.status === "pushing");
}

/**
 * Returns the active push job for a given (target, channel) tuple, or null
 * if none. Used by dashboard rows to attach live progress to a row that
 * matches an in-flight push.
 */
export function selectActivePushJobByTarget(
  s: UploadState,
  target: string,
  channel: string
): PushJob | null {
  for (const id of s.jobOrder) {
    const j = s.jobs[id];
    if (
      j &&
      j.status === "pushing" &&
      j.target === target &&
      j.channel === channel
    ) {
      return j;
    }
  }
  return null;
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
