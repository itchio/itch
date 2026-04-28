import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import { PushJob, UploadState } from "common/types";

const initialState: UploadState = {
  jobs: {},
  jobOrder: [],
  activeJobId: null,
};

/**
 * Returns the in-flight push job, if any. A job is "in flight" only while
 * its status is "pushing"; once it transitions to processing/failed/cancelled
 * we no longer treat it as active even if `activeJobId` hasn't been cleared
 * yet (it briefly lingers between cancelPush and the reactor's pushFailed).
 */
export function selectActivePushJob(s: UploadState): PushJob | null {
  const job = s.activeJobId ? s.jobs[s.activeJobId] ?? null : null;
  return job?.status === "pushing" ? job : null;
}

// History cap — long-running sessions push many builds; we never need more
// than the most recent few in jobs/jobOrder.
const MAX_JOB_HISTORY = 50;

function pruneJobHistory(state: UploadState): UploadState {
  if (state.jobOrder.length <= MAX_JOB_HISTORY) {
    return state;
  }
  const kept = state.jobOrder.slice(0, MAX_JOB_HISTORY);
  const keptSet = new Set(kept);
  const jobs: { [id: string]: PushJob } = {};
  for (const id of kept) {
    const job = state.jobs[id];
    if (job) jobs[id] = job;
  }
  // Preserve the active job even if (somehow) it isn't in the trimmed set.
  if (state.activeJobId && !keptSet.has(state.activeJobId)) {
    const active = state.jobs[state.activeJobId];
    if (active) jobs[state.activeJobId] = active;
  }
  return { ...state, jobs, jobOrder: kept };
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
    if (state.activeJobId) {
      return state;
    }

    const { jobId, createdAt, gameId, target, channel, src } = action.payload;
    const job: PushJob = {
      id: jobId,
      gameId,
      target,
      channel,
      src,
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
      activeJobId: jobId,
    });
  });

  on(actions.pushProgress, (state, action) => {
    const { jobId, progress, label } = action.payload;
    const job = state.jobs[jobId];
    if (!job || job.status !== "pushing") {
      return state;
    }
    if (job.progress === progress && job.label === label) {
      return state;
    }
    return updateJob(state, jobId, {
      progress,
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
      return {
        ...state,
        activeJobId: state.activeJobId === jobId ? null : state.activeJobId,
      };
    }
    return {
      ...updateJob(state, jobId, {
        buildId,
        status: "processing",
        progress: 1,
        label: undefined,
        updatedAt: Date.now(),
      }),
      activeJobId: state.activeJobId === jobId ? null : state.activeJobId,
    };
  });

  on(actions.pushFailed, (state, action) => {
    const { jobId, message } = action.payload;
    const job = state.jobs[jobId];
    if (!job) {
      return state;
    }
    if (job.status === "cancelled") {
      return {
        ...state,
        activeJobId: state.activeJobId === jobId ? null : state.activeJobId,
      };
    }
    return {
      ...updateJob(state, jobId, {
        status: "failed",
        label: undefined,
        message,
        updatedAt: Date.now(),
      }),
      activeJobId: state.activeJobId === jobId ? null : state.activeJobId,
    };
  });

  on(actions.cancelPush, (state, action) => {
    const { jobId } = action.payload;
    const job = state.jobs[jobId];
    if (!job || job.status !== "pushing") {
      return state;
    }
    // We deliberately leave activeJobId set: the reactor's cancel handler
    // gates on it, and the follow-up pushFailed will clear it once the
    // worker subprocess actually exits.
    return updateJob(state, jobId, {
      status: "cancelled",
      label: undefined,
      message: "Cancelled",
      updatedAt: Date.now(),
    });
  });

  on(actions.loggedOut, () => initialState);
});
