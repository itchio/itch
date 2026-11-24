import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Build } from "common/butlerd/messages";
import modals from "renderer/modals";
import {
  selectPushJobBuildIds,
  selectPushJobsByBuildId,
  selectRowlessPushJobs,
} from "common/reducers/upload";
import { PushJob } from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "renderer/basics/Button";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { rcall } from "renderer/butlerd/rcall";
import { rendererLogger } from "renderer/logger";
import {
  dispatchTabEvolve,
  dispatchTabPageUpdate,
  urlWithParams,
} from "renderer/hocs/tab-utils";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useProfile } from "renderer/hooks/useProfile";
import { useTab } from "renderer/hooks/useTab";
import BuildRow from "renderer/pages/UploadPage/BuildRow";
import Filters, { StatusFilter } from "renderer/pages/UploadPage/Filters";
import Page from "renderer/pages/common/Page";
import SearchControl from "renderer/pages/common/SearchControl";
import { Title as BaseTitle, TitleBox } from "renderer/pages/PageStyles/games";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Container = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 12px;
`;

const Title = styled(BaseTitle)`
  color: ${(props) => props.theme.baseText};
`;

const Subtitle = styled.div`
  color: ${(props) => props.theme.secondaryText};
  margin-top: 4px;
`;

const Toolbar = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const Spacer = styled.div`
  flex: 1;
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: 24px 2fr 1.4fr 1fr 1fr 0.8fr 0.8fr 32px;
  gap: 12px;
  padding: 8px 16px;
  color: ${(props) => props.theme.secondaryText};
  text-transform: uppercase;
  font-size: 75%;
  letter-spacing: 0.05em;
  border-bottom: 1px solid ${(props) => props.theme.inputBorder};
`;

const Empty = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: ${(props) => props.theme.secondaryText};
`;

const List = styled.div`
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  overflow: hidden;
  background: ${(props) => props.theme.itemBackground};
`;

const POLL_INTERVAL_MS = 10_000;
const logger = rendererLogger.child("UploadPage");

function isPendingBuild(b: Build): boolean {
  return (
    b.state === messages.BuildState.Started ||
    b.state === messages.BuildState.Queued ||
    b.state === messages.BuildState.Processing
  );
}

type BuildsById = { [buildId: number]: Build };

/**
 * Polls Publish.GetBuild for the pending builds of the last list result,
 * so a row can go from Processing to Live without a list refetch.
 */
function usePendingBuildPolling(profileId: number) {
  /** Overlay merged on top of the list result. Pruned on each list fetch
   *  so the list becomes authoritative again once it catches up. */
  const [polledBuilds, setPolledBuilds] = useState<BuildsById>({});
  /** bumped when a polled build leaves the pending state */
  const [listRefreshSequence, setListRefreshSequence] = useState(0);

  // not state: only the polled results drive rendering
  const poll = useRef({
    pendingIds: new Set<number>(),
    listedBuildIds: new Set<number>(),
    timer: undefined as ReturnType<typeof setInterval> | undefined,
    ticking: false,
    mounted: false,
  }).current;

  const stopPolling = () => {
    if (poll.timer) {
      clearInterval(poll.timer);
      poll.timer = undefined;
    }
  };

  const tick = async () => {
    if (poll.ticking) return;
    poll.ticking = true;
    try {
      const ids = [...poll.pendingIds];
      const polled = await Promise.all(
        ids.map(async (buildId) => {
          try {
            const res = await rcall(messages.PublishGetBuild, {
              profileId,
              buildId,
            });
            return res.build;
          } catch (e) {
            logger.warn(`Publish.GetBuild failed for ${buildId}: ${e}`);
            return null;
          }
        })
      );
      if (!poll.mounted) {
        return;
      }
      const updates: BuildsById = {};
      let shouldRefreshList = false;
      for (const b of polled) {
        if (!b) continue;
        if (poll.listedBuildIds.has(b.id)) {
          updates[b.id] = b;
        }
        if (!isPendingBuild(b)) {
          poll.pendingIds.delete(b.id);
          shouldRefreshList = true;
        }
      }
      if (Object.keys(updates).length > 0) {
        setPolledBuilds((polledBuilds) => ({ ...polledBuilds, ...updates }));
      }
      if (shouldRefreshList) {
        setListRefreshSequence((sequence) => sequence + 1);
      }
      if (poll.pendingIds.size === 0) {
        stopPolling();
      }
    } finally {
      poll.ticking = false;
    }
  };

  const onListResult = (result: messages.PublishListBuildsResult) => {
    const buildIds = new Set<number>();
    const pendingIds = new Set<number>();
    for (const b of result.builds ?? []) {
      buildIds.add(b.id);
      if (isPendingBuild(b)) pendingIds.add(b.id);
    }
    poll.listedBuildIds = buildIds;
    poll.pendingIds = pendingIds;
    setPolledBuilds((polledBuilds) => {
      const pruned: BuildsById = {};
      for (const buildId of pendingIds) {
        const b = polledBuilds[buildId];
        if (b) {
          pruned[buildId] = b;
        }
      }
      return pruned;
    });

    if (pendingIds.size > 0 && !poll.timer) {
      poll.timer = setInterval(tick, POLL_INTERVAL_MS);
      // Don't wait a full interval for the first poll: kick one off
      // immediately so a build that just transitioned out of pending is
      // reflected without a 10s delay.
      void tick();
    } else if (pendingIds.size === 0) {
      stopPolling();
    }
  };

  useEffect(() => {
    poll.mounted = true;
    return () => {
      poll.mounted = false;
      stopPolling();
    };
  }, []);

  return { polledBuilds, listRefreshSequence, onListResult };
}

const UploadPage = ({ sequence }: MeatProps) => {
  const tab = useTab();
  const dispatch = useAppDispatch();
  const profile = useProfile();

  const query = useAppSelector((rs) => ambientTab(rs, { tab }).location?.query);
  const url = useAppSelector((rs) => ambientTab(rs, { tab }).location?.url);
  /** Push jobs without a buildId yet, rendered as synthetic rows on top. */
  const rowlessJobs = useAppSelector((rs) => selectRowlessPushJobs(rs.upload));
  /** Push jobs with a confirmed buildId, keyed by buildId. Overlaid onto
   *  the matching server build row to surface live progress / errors. */
  const pushJobsByBuildId = useAppSelector((rs) =>
    selectPushJobsByBuildId(rs.upload)
  );
  /** Build IDs of those overlay jobs, for opting them into the list query
   *  (otherwise started-state builds aren't returned by /profile/builds). */
  const pushJobBuildIds = useAppSelector((rs) =>
    selectPushJobBuildIds(rs.upload)
  );

  const rawStatus = query?.status;
  const status: StatusFilter =
    rawStatus === "live" || rawStatus === "processing" || rawStatus === "failed"
      ? rawStatus
      : "";
  const search = query?.search ?? "";

  useEffect(() => {
    dispatchTabPageUpdate({ tab, dispatch }, { label: ["sidebar.upload"] });
  }, [tab, dispatch]);

  const { polledBuilds, listRefreshSequence, onListResult } =
    usePendingBuildPolling(profile.id);

  const { loading, error, result } = useButlerd(
    messages.PublishListBuilds,
    {
      profileId: profile.id,
      page: 1,
      perPage: 50,
      state: status || undefined,
      includeTotals: true,
      // Opt our in-flight pushes (state="started" until upload
      // completes) into the listing so they render as real server
      // rows from the moment CreateBuild returns.
      startedBuildIds: pushJobBuildIds.length > 0 ? pushJobBuildIds : undefined,
    },
    { sequence: sequence + listRefreshSequence, onResult: onListResult }
  );

  // BuildRow is memoized, keep this stable
  const setSearch = useCallback(
    (search: string) => {
      if (!url) {
        // tab hasn't derived a location yet, nothing to evolve
        return;
      }
      dispatchTabEvolve(
        { tab, dispatch },
        { replace: true, url: urlWithParams(url, { search }) }
      );
    },
    [tab, dispatch, url]
  );

  const handlePushNewBuild = () => {
    dispatch(
      actions.openModal(
        modals.pushBuild.make({
          wind: ambientWind(),
          title: "Push new build",
          message: "",
          widgetParams: {},
        })
      )
    );
  };

  const builds = (result?.builds ?? []).map((b) => polledBuilds[b.id] ?? b);
  const totals = result?.totals;

  const q = (search || "").trim().toLowerCase();
  const filtered = q ? builds.filter((b) => buildMatchesSearch(b, q)) : builds;

  // Synthetic top-rows cover the windows where no real server
  // row is available: pre-CreateBuild (no buildId), mid-upload
  // (list refetch hasn't caught up to startedBuildIds yet), or
  // a terminal local failure that the server still sees as
  // started. Drop any whose server row is in the list (overlay
  // covers them — dedupe against the unfiltered list so search
  // hiding the server row doesn't unmask a synthetic), then
  // tab-filter and search-filter so synthetic rows respect the
  // same filters and query as real rows.
  const syntheticToShow = rowlessJobs.filter((j) => {
    if (j.buildId && builds.some((b) => b.id === j.buildId)) {
      return false;
    }
    if (!jobMatchesStatusFilter(j, status)) {
      return false;
    }
    if (q && !pushJobMatchesSearch(j, q)) {
      return false;
    }
    return true;
  });

  return (
    <Page>
      <FiltersContainer loading={loading}>
        <SearchControl placeholder={_("upload.search_placeholder")} />
      </FiltersContainer>
      <Container>
        <TitleBox>
          <Title className="upload-title">{T(_("upload.title"))}</Title>
          <Subtitle className="upload-subtitle">
            {totals
              ? T([
                  "upload.subtitle",
                  {
                    builds: totals.all,
                    projects: totals.projectCount,
                  },
                ])
              : T(_("upload.subtitle_loading"))}
          </Subtitle>
        </TitleBox>
        <Toolbar>
          <Filters
            tab={tab}
            totals={
              totals
                ? {
                    all: totals.all,
                    live: totals.live,
                    processing: totals.processing,
                    failed: totals.failed,
                  }
                : undefined
            }
          />
          <Spacer />
          <Button primary icon="upload" onClick={handlePushNewBuild}>
            {T(_("upload.push_new_build"))}
          </Button>
        </Toolbar>

        {error ? <Empty>{error.message}</Empty> : null}

        {!error && filtered.length === 0 && syntheticToShow.length === 0 ? (
          <Empty>
            {loading
              ? T(_("upload.loading"))
              : status || q
              ? T(_("upload.empty_filtered"))
              : T(_("upload.empty"))}
          </Empty>
        ) : (
          <List>
            <Columns>
              <span />
              <span>{T(_("upload.col.project"))}</span>
              <span>{T(_("upload.col.channel"))}</span>
              <span>{T(_("upload.col.version"))}</span>
              <span>{T(_("upload.col.status"))}</span>
              <span>{T(_("upload.col.size"))}</span>
              <span>{T(_("upload.col.pushed"))}</span>
              <span />
            </Columns>
            {syntheticToShow.map((job) => (
              <BuildRow
                key={`syn-${job.id}`}
                build={null}
                pushJob={job}
                onSetSearch={setSearch}
              />
            ))}
            {filtered.map((build) => (
              <BuildRow
                key={`${build.id}-${build.uploadId}`}
                build={build}
                pushJob={pushJobsByBuildId[build.id]}
                onSetSearch={setSearch}
              />
            ))}
          </List>
        )}
      </Container>
    </Page>
  );
};

function jobMatchesStatusFilter(j: PushJob, status: StatusFilter): boolean {
  switch (status) {
    case "live":
      return false;
    case "processing":
      return j.status === "pushing";
    case "failed":
      return j.status === "failed" || j.status === "cancelled";
    default:
      return true;
  }
}

function buildMatchesSearch(build: Build, q: string): boolean {
  const title = build.game?.title?.toLowerCase() ?? "";
  const url = build.game?.url?.toLowerCase() ?? "";
  const channel = build.upload?.channelName?.toLowerCase() ?? "";
  const version = (build.userVersion ?? "").toLowerCase();
  return (
    title.includes(q) ||
    url.includes(q) ||
    channel.includes(q) ||
    version.includes(q)
  );
}

function pushJobMatchesSearch(j: PushJob, q: string): boolean {
  const title = j.gameTitle?.toLowerCase() ?? "";
  const target = j.target?.toLowerCase() ?? "";
  const channel = j.channel?.toLowerCase() ?? "";
  return title.includes(q) || target.includes(q) || channel.includes(q);
}

export default UploadPage;
