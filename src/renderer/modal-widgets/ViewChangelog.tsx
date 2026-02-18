import {
  ViewChangelogParams,
  ViewChangelogResponse,
} from "common/modals/types";
import { actions } from "common/actions";
import { Dispatch } from "common/types";
import React from "react";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { ModalWidgetProps } from "common/modals";
import Markdown from "renderer/basics/Markdown";
import Button from "renderer/basics/Button";
import Link from "renderer/basics/Link";
import { hook } from "renderer/hocs/hook";
import urls from "common/constants/urls";

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  published_at: string;
  body: string;
}

interface State {
  releases: GitHubRelease[];
  loading: boolean;
  error: string | null;
}

class ViewChangelog extends React.PureComponent<Props, State> {
  private abortController: AbortController | null = null;

  state: State = {
    releases: [],
    loading: true,
    error: null,
  };

  componentDidMount() {
    this.fetchReleases();
  }

  componentWillUnmount() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  async fetchReleases() {
    if (this.abortController) {
      this.abortController.abort();
    }
    const abortController = new AbortController();
    this.abortController = abortController;

    try {
      this.setState({ loading: true, error: null });

      const response = await fetch(
        `${urls.itchRepo}/releases`.replace(
          "github.com",
          "api.github.com/repos"
        ) + "?per_page=10",
        { signal: abortController.signal }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: GitHubRelease[] = await response.json();

      this.setState({
        releases: data,
        loading: false,
        error: null,
      });
    } catch (e) {
      if (abortController.signal.aborted) {
        return;
      }

      let errorMessage = "Failed to fetch releases";
      if (e instanceof Error && e.message) {
        errorMessage = e.message;
      }
      this.setState({ error: errorMessage, loading: false });
    }
  }

  render() {
    const { loading, error, releases } = this.state;

    return (
      <ChangelogDialog>
        <HeaderBar>
          <HeaderMeta>
            <h2>Recent releases</h2>
            <p>Latest updates from itch app releases on GitHub.</p>
          </HeaderMeta>
          <Link onClick={this.onOpenReleasesPage} label="Open on GitHub" />
        </HeaderBar>

        <ChangelogContainer>
          {loading && <LoadingState />}
          {!loading && error && (
            <StatusPanel>
              <h3>Could not load changelog</h3>
              <p>{error}</p>
              <Button label="Retry" onClick={this.onRetry} />
            </StatusPanel>
          )}
          {!loading && !error && releases.length === 0 && (
            <StatusPanel>
              <h3>No releases found</h3>
              <p>GitHub returned an empty release list.</p>
            </StatusPanel>
          )}
          {!loading &&
            !error &&
            releases.length > 0 &&
            releases.map((release) => {
              const title = (release.name || release.tag_name || "").trim();
              const hasDistinctTag = hasDistinctReleaseTag(
                title,
                release.tag_name
              );

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
          {!loading && !error && releases.length > 0 && (
            <AllReleasesLink>
              <Link
                onClick={this.onOpenReleasesPage}
                label="See all release notes on GitHub"
              />
            </AllReleasesLink>
          )}
        </ChangelogContainer>
      </ChangelogDialog>
    );
  }

  onRetry = () => {
    this.fetchReleases();
  };

  onOpenReleasesPage = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.openInExternalBrowser({ url: `${urls.itchRepo}/releases` })
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
  gap: 14px;
  overflow: hidden;
  min-height: 280px;
  max-height: 70vh;
`;

const HeaderBar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid ${(props) => props.theme.prefBorder};
  background: ${(props) => props.theme.sidebarBackground};
`;

const HeaderMeta = styled.div`
  h2 {
    margin: 0;
    font-size: ${(props) => props.theme.fontSizes.large};
  }

  p {
    margin: 4px 0 0;
    color: ${(props) => props.theme.secondaryText};
  }
`;

const ChangelogContainer = styled.div`
  overflow-y: auto;
  padding-right: 6px;
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
