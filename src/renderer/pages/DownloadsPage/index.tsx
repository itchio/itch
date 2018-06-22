import { Download, GameUpdate } from "common/butlerd/messages";
import { IRootState } from "common/types";
import {
  getFinishedDownloads,
  getPendingDownloads,
} from "main/reactors/downloads/getters";
import React from "react";
import Button from "renderer/basics/Button";
import EmptyState from "renderer/basics/EmptyState";
import Link from "renderer/basics/Link";
import LoadingCircle from "renderer/basics/LoadingCircle";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import GameUpdateRow from "renderer/pages/DownloadsPage/GameUpdateRow";
import Row from "renderer/pages/DownloadsPage/Row";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { createStructuredSelector } from "reselect";
import { first, isEmpty, map, rest, size } from "underscore";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { Title } from "renderer/pages/PageStyles/games";

const DownloadsDiv = styled.div`
  ${styles.meat()};
`;

const DownloadsContentDiv = styled.div`
  overflow-y: auto;
  padding: 0 20px 20px 10px;
  padding-top: 15px;
  position: relative;

  .global-controls {
    position: absolute;
    top: 20px;
    right: 20px;
  }

  .section-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 20px 0 20px 10px;
    flex-shrink: 0;

    .spacer {
      height: 1px;
      width: 1em;
    }

    .filler {
      flex-grow: 1;
    }

    .clear {
      margin-left: 8px;
      ${styles.clickable()};
    }
  }

  .game-actions .main-action {
    padding: 3px 10px;
  }
`;

class Downloads extends React.PureComponent<Props & DerivedProps> {
  render() {
    return (
      <DownloadsDiv>
        <FiltersContainer loading={false} />
        {this.renderContents()}
      </DownloadsDiv>
    );
  }

  renderContents() {
    const { items, finishedItems, updates } = this.props;
    const { navigate } = this.props;

    const allEmpty =
      isEmpty(items) && isEmpty(finishedItems) && isEmpty(updates);
    if (allEmpty) {
      return (
        <DownloadsContentDiv>
          {this.renderControls()}
          <EmptyState
            className="no-active-downloads"
            icon="download"
            bigText={["status.downloads.no_active_downloads"]}
            smallText={["status.downloads.no_active_downloads_subtext"]}
            buttonIcon="earth"
            buttonText={["status.downloads.find_games_button"]}
            buttonAction={() =>
              navigate({ window: "root", url: "itch://featured" })
            }
          />
        </DownloadsContentDiv>
      );
    }

    const firstItem = first(items);
    const queuedItems = rest(items);

    return (
      <DownloadsContentDiv>
        {this.renderControls()}
        {this.renderFirstItem(firstItem)}
        {this.renderQueuedItems(queuedItems)}
        {this.renderRecentActivity()}
        {this.renderUpdates()}
      </DownloadsContentDiv>
    );
  }

  renderFirstItem(firstItem: Download): JSX.Element {
    if (!firstItem) {
      return null;
    }

    return (
      <>
        <div className="section-bar">
          <Title>{T(["status.downloads.category.active"])}</Title>
        </div>

        <Row key={firstItem.id} item={firstItem} first />
      </>
    );
  }

  renderQueuedItems(queuedItems: Download[]): JSX.Element {
    if (isEmpty(queuedItems)) {
      return null;
    }

    return (
      <>
        <div className="section-bar">
          <Title>{T(["status.downloads.category.queued"])}</Title>
        </div>
        {map(queuedItems, (item, i) => <Row key={item.id} item={item} />)}
      </>
    );
  }

  renderUpdates(): JSX.Element {
    const { updates, updateCheckHappening, updateCheckProgress } = this.props;

    if (isEmpty(updates) && !updateCheckHappening) {
      return null;
    }

    return (
      <>
        <div className="section-bar">
          <Title className="finished-header">
            {T(["status.downloads.updates_available"])} ({size(updates)})
          </Title>
          <Link
            label={T(["status.downloads.update_all"])}
            onClick={this.onUpdateAll}
          />
          {updateCheckHappening ? (
            <>
              <div className="spacer" />
              <LoadingCircle progress={updateCheckProgress} />
            </>
          ) : null}
        </div>
        {map(updates, (update, k) => <GameUpdateRow key={k} update={update} />)}
      </>
    );
  }

  renderControls(): JSX.Element {
    return (
      <>
        <div className="global-controls">
          {this.props.downloadsPaused ? (
            <Button discreet icon="triangle-right" onClick={this.onTogglePause}>
              {T(["status.downloads.resume_downloads"])}
            </Button>
          ) : (
            <Button discreet icon="pause" onClick={this.onTogglePause}>
              {T(["status.downloads.pause_downloads"])}
            </Button>
          )}
        </div>
      </>
    );
  }

  onTogglePause = () => {
    const { downloadsPaused, setDownloadsPaused } = this.props;
    setDownloadsPaused({ paused: !downloadsPaused });
  };

  renderRecentActivity(): JSX.Element {
    const { finishedItems, clearFinishedDownloads } = this.props;

    if (isEmpty(finishedItems)) {
      return null;
    }

    return (
      <>
        <div key="finished-header" className="section-bar">
          <Title className="finished-header">
            {T(["status.downloads.category.recent_activity"])}
          </Title>
          <Link
            className="downloads-clear-all"
            onClick={() => clearFinishedDownloads({})}
          >
            {T(["status.downloads.clear_all_finished"])}
          </Link>
        </div>
        {map(finishedItems, item => <Row key={item.id} item={item} finished />)}
      </>
    );
  }

  onUpdateAll = () => {
    this.props.queueAllGameUpdates({});
  };
}

interface Props extends MeatProps {}

const actionCreators = actionCreatorsList(
  "clearFinishedDownloads",
  "navigate",
  "queueAllGameUpdates",
  "setDownloadsPaused"
);

type DerivedProps = Dispatchers<typeof actionCreators> & {
  items: Download[];
  finishedItems: Download[];
  updates: {
    [caveId: string]: GameUpdate;
  };
  updateCheckHappening: boolean;
  updateCheckProgress: number;
  downloadsPaused: boolean;
};

export default connect<Props>(
  Downloads,
  {
    state: createStructuredSelector({
      items: (rs: IRootState) => getPendingDownloads(rs.downloads),
      finishedItems: (rs: IRootState) => getFinishedDownloads(rs.downloads),
      updates: (rs: IRootState) => rs.gameUpdates.updates,
      updateCheckHappening: (rs: IRootState) => rs.gameUpdates.checking,
      updateCheckProgress: (rs: IRootState) => rs.gameUpdates.progress,
      downloadsPaused: (rs: IRootState) => rs.downloads.paused,
    }),
    actionCreators,
  }
);
