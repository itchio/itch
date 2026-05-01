import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Build, Profile } from "common/butlerd/messages";
import modals from "renderer/modals";
import { selectActivePushJobs } from "common/reducers/upload";
import { Dispatch, PushJob, RootState } from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import React from "react";
import Button from "renderer/basics/Button";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import {
  dispatchTabEvolve,
  dispatchTabPageUpdate,
  urlWithParams,
} from "renderer/hocs/tab-utils";
import { withProfile } from "renderer/hocs/withProfile";
import { withTab } from "renderer/hocs/withTab";
import BuildRow from "renderer/pages/UploadPage/BuildRow";
import Filters, { StatusFilter } from "renderer/pages/UploadPage/Filters";
import UploadSearch from "renderer/pages/UploadPage/UploadSearch";
import Page from "renderer/pages/common/Page";
import { Title as BaseTitle, TitleBox } from "renderer/pages/PageStyles/games";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const FetchBuilds = butlerCaller(messages.WharfListBuilds);

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

interface Props extends MeatProps {
  profile: Profile;
  tab: string;
  dispatch: Dispatch;

  status: StatusFilter;
  search: string;
  url: string;

  syntheticJobs: PushJob[];
}

class UploadPage extends React.PureComponent<Props> {
  override componentDidMount() {
    dispatchTabPageUpdate(this.props, { label: ["sidebar.upload"] });
  }

  override render() {
    const { profile, tab, status, search, syntheticJobs, sequence } =
      this.props;

    return (
      <Page>
        <FetchBuilds
          params={{
            profileId: profile.id,
            page: 1,
            perPage: 50,
            state: status || undefined,
            includeTotals: true,
          }}
          sequence={sequence}
          errorsHandled
          loadingHandled
          render={({ result, loading, error }) => {
            const builds = result?.builds ?? [];
            const totals = result?.totals;

            const q = (search || "").trim().toLowerCase();
            const filtered = q
              ? builds.filter((b) => buildMatchesSearch(b, q))
              : builds;

            // Synthetic rows: jobs not yet associated with a server-side
            // build go on top.
            const syntheticToShow = syntheticJobs.filter(
              (j) => !builds.some((b) => b.id === j.buildId)
            );

            return (
              <>
                <FiltersContainer loading={loading} />
                <Container>
                  <TitleBox>
                    <Title>{T(_("upload.title"))}</Title>
                    <Subtitle>
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
                    <UploadSearch />
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
                    <Button
                      primary
                      icon="upload"
                      onClick={this.handlePushNewBuild}
                    >
                      {T(_("upload.push_new_build"))}
                    </Button>
                  </Toolbar>

                  {error ? <Empty>{error.message}</Empty> : null}

                  {!error &&
                  filtered.length === 0 &&
                  syntheticToShow.length === 0 ? (
                    <Empty>
                      {loading ? T(_("upload.loading")) : T(_("upload.empty"))}
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
                          syntheticJob={job}
                          tab={tab}
                          onSetSearch={this.setSearch}
                        />
                      ))}
                      {filtered.map((build) => (
                        <BuildRow
                          key={`${build.id}-${build.uploadId}`}
                          build={build}
                          tab={tab}
                          onSetSearch={this.setSearch}
                        />
                      ))}
                    </List>
                  )}
                </Container>
              </>
            );
          }}
        />
      </Page>
    );
  }

  setSearch = (search: string) => {
    dispatchTabEvolve(this.props, {
      replace: true,
      url: urlWithParams(this.props.url, { search }),
    });
  };

  handlePushNewBuild = () => {
    this.props.dispatch(
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

export default withProfile(
  withTab(
    hookWithProps(UploadPage)((map) => ({
      status: map((rs: RootState, props: any) => {
        const q = ambientTab(rs, props).location.query;
        const s = (q.status ?? "") as StatusFilter;
        if (s === "live" || s === "processing" || s === "failed") return s;
        return "" as StatusFilter;
      }),
      search: map(
        (rs: RootState, props: any) =>
          ambientTab(rs, props).location.query.search ?? ""
      ),
      url: map(
        (rs: RootState, props: any) => ambientTab(rs, props).location.url
      ),
      syntheticJobs: map((rs: RootState) => selectActivePushJobs(rs.upload)),
    }))(UploadPage)
  )
);
