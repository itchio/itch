import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";
import { createStructuredSelector } from "reselect";

import { T } from "renderer/t";

import { map, first, rest, isEmpty, size } from "underscore";

import Link from "./basics/link";
import Button from "./basics/button";
import Row from "./download/row";
import GameUpdateRow from "./download/game-update-row";
import EmptyState from "./empty-state";

import { IRootState } from "common/types";

import {
  getPendingDownloads,
  getFinishedDownloads,
} from "main/reactors/downloads/getters";

import { IMeatProps } from "renderer/components/meats/types";

import styled, * as styles from "./styles";
import { GameUpdate, Download } from "common/butlerd/messages";
import LoadingCircle from "./basics/loading-circle";

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

    h2 {
      font-size: 22px;
      margin-right: 1em;
    }

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

class Downloads extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    return <DownloadsDiv>{this.renderContents()}</DownloadsDiv>;
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
            buttonAction={() => navigate({ url: "itch://featured" })}
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
          <h2>{T(["status.downloads.category.active"])}</h2>
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
          <h2>{T(["status.downloads.category.queued"])}</h2>
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
          <h2 className="finished-header">
            {T(["status.downloads.updates_available"])} ({size(updates)})
          </h2>
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
          <h2 className="finished-header">
            {T(["status.downloads.category.recent_activity"])}
          </h2>
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

interface IProps extends IMeatProps {}

const actionCreators = actionCreatorsList(
  "clearFinishedDownloads",
  "navigate",
  "queueAllGameUpdates",
  "setDownloadsPaused"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  items: Download[];
  finishedItems: Download[];
  updates: {
    [caveId: string]: GameUpdate;
  };
  updateCheckHappening: boolean;
  updateCheckProgress: number;
  downloadsPaused: boolean;
};

export default connect<IProps>(Downloads, {
  state: createStructuredSelector({
    items: (rs: IRootState) => getPendingDownloads(rs.downloads),
    finishedItems: (rs: IRootState) => getFinishedDownloads(rs.downloads),
    updates: (rs: IRootState) => rs.gameUpdates.updates,
    updateCheckHappening: (rs: IRootState) => rs.gameUpdates.checking,
    updateCheckProgress: (rs: IRootState) => rs.gameUpdates.progress,
    downloadsPaused: (rs: IRootState) => rs.downloads.paused,
  }),
  actionCreators,
});
