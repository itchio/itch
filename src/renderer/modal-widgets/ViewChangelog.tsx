import { actions } from "common/actions";
import urls from "common/constants/urls";
import { ModalWidgetProps } from "common/modals";
import {
  ViewChangelogParams,
  ViewChangelogResponse,
} from "common/modals/types";
import { Dispatch } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import Link from "renderer/basics/Link";
import Markdown from "renderer/basics/Markdown";
import env from "renderer/env";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

type RepoKey = "itch" | "butler" | "itchSetup";

interface RepoConfig {
  label: string;
  description: string;
  repoUrl: string;
  releasesUrl: string;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  published_at: string;
  body: string;
}

interface GitHubApiRelease extends GitHubRelease {
  draft: boolean;
  prerelease: boolean;
}

interface RepoState {
  releases: GitHubRelease[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

interface State {
  activeTab: RepoKey;
  repoStates: Record<RepoKey, RepoState>;
}

const repoOrder: RepoKey[] = ["itch", "butler", "itchSetup"];

const repoConfigs: Record<RepoKey, RepoConfig> = {
  itch: {
    label: "itch",
    description: "Latest published itch app releases from GitHub.",
    repoUrl: urls.itchRepo,
    releasesUrl: urls.releasesPage,
  },
  butler: {
    label: "butler",
    description: "Latest published butler releases from GitHub.",
    repoUrl: urls.butlerRepo,
    releasesUrl: urls.butlerReleasesPage,
  },
  itchSetup: {
    label: "itch-setup",
    description: "Latest published itch-setup releases from GitHub.",
    repoUrl: urls.itchSetupRepo,
    releasesUrl: urls.itchSetupReleasesPage,
  },
};

const emptyRepoState = (): RepoState => ({
  releases: [],
  loading: false,
  loaded: false,
  error: null,
});

class ViewChangelog extends React.PureComponent<Props, State> {
  private abortControllers: Partial<Record<RepoKey, AbortController>> = {};

  state: State = {
    activeTab: "itch",
    repoStates: {
      itch: emptyRepoState(),
      butler: emptyRepoState(),
      itchSetup: emptyRepoState(),
    },
  };

  componentDidMount() {
    this.fetchReleasesForRepo("itch");
  }

  componentWillUnmount() {
    for (const repoKey of repoOrder) {
      const controller = this.abortControllers[repoKey];
      if (controller) {
        controller.abort();
      }
    }
  }

  render() {
    const { activeTab } = this.state;
    const activeRepoConfig = repoConfigs[activeTab];
    const activeTabIndex = repoOrder.indexOf(activeTab);

    return (
      <ChangelogDialog>
        <Tabs selectedIndex={activeTabIndex} onSelect={this.onTabSelected}>
          <TabList>
            {repoOrder.map((repoKey) => (
              <Tab key={repoKey}>{repoConfigs[repoKey].label}</Tab>
            ))}
          </TabList>

          <HeaderBar>
            <HeaderMeta>
              <h2>Recent releases</h2>
              <p>{activeRepoConfig.description}</p>
            </HeaderMeta>
            <Link
              onClick={this.onOpenActiveReleasesPage}
              label="Open on GitHub"
            />
          </HeaderBar>

          {repoOrder.map((repoKey) => (
            <TabPanel key={repoKey}>
              <ChangelogContainer>
                {this.renderRepoPanel(repoKey)}
              </ChangelogContainer>
            </TabPanel>
          ))}
        </Tabs>
      </ChangelogDialog>
    );
  }

  renderRepoPanel(repoKey: RepoKey) {
    const repoState = this.state.repoStates[repoKey];
    const repoConfig = repoConfigs[repoKey];
    const { loading, error, releases } = repoState;

    if (loading) {
      return <LoadingState />;
    }

    if (error) {
      return (
        <StatusPanel>
          <h3>Could not load changelog</h3>
          <p>{error}</p>
          <Button label="Retry" onClick={() => this.onRetry(repoKey)} />
        </StatusPanel>
      );
    }

    if (releases.length === 0) {
      return (
        <StatusPanel>
          <h3>No releases found</h3>
          <p>GitHub returned no published releases for {repoConfig.label}.</p>
        </StatusPanel>
      );
    }

    return (
      <>
        {releases.map((release) => {
          const title = (release.name || release.tag_name || "").trim();
          const hasDistinctTag = hasDistinctReleaseTag(title, release.tag_name);

          return (
            <ReleaseSection key={release.id}>
              <ReleaseHeader>
                <TitleBlock>
                  <h3>{title}</h3>
                </TitleBlock>
                <MetaBlock>
                  {hasDistinctTag ? (
                    <span className="tag">{release.tag_name}</span>
                  ) : null}
                  <time>
                    {new Date(release.published_at).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </time>
                </MetaBlock>
              </ReleaseHeader>
              {release.body ? (
                <ReleaseBody>
                  <Markdown source={release.body} externalLinks />
                </ReleaseBody>
              ) : (
                <EmptyBody>This release has no notes.</EmptyBody>
              )}
            </ReleaseSection>
          );
        })}
        <AllReleasesLink>
          <Link
            onClick={() => this.onOpenReleasesPage(repoKey)}
            label="See all release notes on GitHub"
          />
        </AllReleasesLink>
      </>
    );
  }

  fetchReleasesForRepo = async (repoKey: RepoKey, force = false) => {
    const repoState = this.state.repoStates[repoKey];
    if (repoState.loading) {
      return;
    }
    if (repoState.loaded && !force) {
      return;
    }

    const existingController = this.abortControllers[repoKey];
    if (existingController) {
      existingController.abort();
    }

    const abortController = new AbortController();
    this.abortControllers[repoKey] = abortController;

    this.setState((prevState) => ({
      repoStates: {
        ...prevState.repoStates,
        [repoKey]: {
          ...prevState.repoStates[repoKey],
          loading: true,
          error: null,
        },
      },
    }));

    const repoConfig = repoConfigs[repoKey];
    const perPage = repoKey === "itch" ? 30 : 10;
    const releasesApiUrl =
      `${repoConfig.repoUrl}`.replace("github.com", "api.github.com/repos") +
      `/releases?per_page=${perPage}`;

    try {
      const response = await fetch(releasesApiUrl, {
        signal: abortController.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GitHubApiRelease[] = await response.json();
      let releases = data
        .filter((release) => !release.draft && !release.prerelease)
        .map((release) => ({
          id: release.id,
          tag_name: release.tag_name,
          name: release.name,
          published_at: release.published_at,
          body: release.body,
        }));

      // Stable "itch" builds should not display canary-tagged app releases.
      if (repoKey === "itch" && env.appName === "itch") {
        releases = releases.filter(
          (release) => !/-canary/i.test(release.tag_name)
        );
      }

      this.setState((prevState) => ({
        repoStates: {
          ...prevState.repoStates,
          [repoKey]: {
            releases,
            loading: false,
            loaded: true,
            error: null,
          },
        },
      }));
    } catch (e) {
      if (abortController.signal.aborted) {
        return;
      }

      let errorMessage = "Failed to fetch releases";
      if (e instanceof Error && e.message) {
        errorMessage = e.message;
      }

      this.setState((prevState) => ({
        repoStates: {
          ...prevState.repoStates,
          [repoKey]: {
            ...prevState.repoStates[repoKey],
            loading: false,
            error: errorMessage,
          },
        },
      }));
    } finally {
      if (this.abortControllers[repoKey] === abortController) {
        delete this.abortControllers[repoKey];
      }
    }
  };

  onTabSelected = (tabIndex: number) => {
    const nextRepoKey = repoOrder[tabIndex] || "itch";
    this.setState({ activeTab: nextRepoKey });
    this.fetchReleasesForRepo(nextRepoKey);
  };

  onRetry = (repoKey: RepoKey) => {
    this.fetchReleasesForRepo(repoKey, true);
  };

  onOpenActiveReleasesPage = () => {
    this.onOpenReleasesPage(this.state.activeTab);
  };

  onOpenReleasesPage = (repoKey: RepoKey) => {
    const { dispatch } = this.props;
    dispatch(
      actions.openInExternalBrowser({ url: repoConfigs[repoKey].releasesUrl })
    );
  };
}

function LoadingState() {
  return (
    <LoadingList>
      <LoadingCard>
        <LoadingLine className="line-lg" />
        <LoadingLine className="line-sm" />
        <LoadingLine className="line-md" />
      </LoadingCard>
      <LoadingCard>
        <LoadingLine className="line-lg" />
        <LoadingLine className="line-sm" />
        <LoadingLine className="line-md" />
      </LoadingCard>
      <LoadingCard>
        <LoadingLine className="line-lg" />
        <LoadingLine className="line-sm" />
      </LoadingCard>
    </LoadingList>
  );
}

function hasDistinctReleaseTag(title: string, tagName: string): boolean {
  const normalizedTitle = normalizeReleaseLabel(title);
  const normalizedTag = normalizeReleaseLabel(tagName);
  return normalizedTag.length > 0 && normalizedTitle !== normalizedTag;
}

function normalizeReleaseLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

const ChangelogDialog = styled(ModalWidgetDiv)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  width: clamp(700px, 86vw, 980px);
  height: clamp(460px, 70vh, 780px);

  .react-tabs {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .react-tabs__tab-panel {
    display: none;
  }

  .react-tabs__tab-panel--selected {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
`;

const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 8px 2px 10px;
`;

const HeaderMeta = styled.div`
  h2 {
    margin: 0;
    font-size: ${(props) => props.theme.fontSizes.large};
  }

  p {
    margin: 4px 0 0;
    font-size: ${(props) => props.theme.fontSizes.small};
    color: ${(props) => props.theme.secondaryText};
  }
`;

const ChangelogContainer = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
`;

const ReleaseSection = styled.section`
  margin: 0 0 12px;
  padding: 12px 14px 14px;
  border: 1px solid ${(props) => props.theme.prefBorder};
  border-left-width: 3px;
  border-left-color: ${(props) => props.theme.accent};
  background: ${(props) => props.theme.sidebarBackground};

  &:last-child {
    margin-bottom: 0;
  }
`;

const ReleaseHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
`;

const TitleBlock = styled.div`
  min-width: 0;

  h3 {
    margin: 0;
    font-size: ${(props) => props.theme.fontSizes.modal};
    font-weight: bold;
  }
`;

const MetaBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;

  .tag {
    color: ${(props) => props.theme.secondaryText};
    font-size: ${(props) => props.theme.fontSizes.small};
    white-space: nowrap;
  }

  time {
    color: ${(props) => props.theme.secondaryText};
    font-size: ${(props) => props.theme.fontSizes.small};
    white-space: nowrap;
  }
`;

const ReleaseBody = styled.div`
  line-height: 1.45;

  h1,
  h2,
  h3,
  h4 {
    margin: 12px 0 8px;
    font-size: ${(props) => props.theme.fontSizes.large};
  }

  p {
    margin: 8px 0;
  }

  ul,
  ol {
    margin: 8px 0 10px;
    padding-left: 20px;
  }

  li {
    margin: 4px 0;
  }

  pre {
    margin: 10px 0;
    padding: 10px;
    overflow: auto;
    border: 1px solid ${(props) => props.theme.prefBorder};
    background: rgba(0, 0, 0, 0.25);
    white-space: pre-wrap;
  }

  code {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.3);
    padding: 1px 4px;
    border-radius: 3px;
  }

  a {
    text-decoration: underline;
  }

  img,
  table {
    max-width: 100%;
  }
`;

const EmptyBody = styled.p`
  margin: 0;
  font-style: italic;
  color: ${(props) => props.theme.secondaryText};
`;

const AllReleasesLink = styled.div`
  text-align: center;
  padding: 12px 0;
`;

const StatusPanel = styled.div`
  border: 1px solid ${(props) => props.theme.prefBorder};
  background: ${(props) => props.theme.sidebarBackground};
  padding: 16px;

  h3 {
    margin: 0 0 6px;
    font-size: ${(props) => props.theme.fontSizes.large};
  }

  p {
    margin: 0 0 12px;
    color: ${(props) => props.theme.secondaryText};
  }
`;

const LoadingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LoadingCard = styled.div`
  border: 1px solid ${(props) => props.theme.prefBorder};
  background: ${(props) => props.theme.sidebarBackground};
  padding: 14px;
`;

const LoadingLine = styled.div`
  height: 10px;
  border-radius: 3px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.08);

  &.line-lg {
    width: 70%;
  }

  &.line-md {
    width: 55%;
  }

  &.line-sm {
    width: 35%;
  }
`;

interface Props
  extends ModalWidgetProps<ViewChangelogParams, ViewChangelogResponse> {
  dispatch: Dispatch;
}

export default hook()(ViewChangelog);
