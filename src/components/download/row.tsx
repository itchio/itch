import * as React from "react";
import * as classNames from "classnames";
import { connect, Dispatchers, actionCreatorsList } from "../connect";
import Chart from "./chart";

import { downloadProgress } from "../../format";

import TimeAgo from "../basics/time-ago";
import IconButton from "../basics/icon-button";
import Button from "../basics/button";
import Hover, { IHoverProps } from "../basics/hover-hoc";
import Cover from "../basics/cover";
import MainAction from "../game-actions/main-action";

import { IDownloadSpeeds, ITask, IRootState } from "../../types";

import styled, * as styles from "../styles";

import format from "../format";
import doesEventMeanBackground from "../when-click-navigates";
import getGameStatus, {
  IGameStatus,
  IOperation,
  OperationType,
} from "../../helpers/get-game-status";
import {
  formatReason,
  formatOutcome,
  formatOperation,
} from "../../format/operation";
import { formatUploadTitle } from "../../format/upload";
import { modalWidgets } from "../modal-widgets/index";
import { DownloadProgress, Download } from "../../buse/messages";

const DownloadRowDiv = styled.div`
  font-size: ${props => props.theme.fontSizes.large};

  flex-shrink: 0;
  line-height: 1.6;
  border-radius: 2px;
  padding: 7px 5px 7px 10px;
  margin: 10px 0px 5px 0px;
  cursor: default;
  position: relative;

  max-width: 800px;

  border: 1px solid transparent;

  &.finished {
    cursor: pointer;
  }

  background-color: ${props => props.theme.itemBackground};

  .cover,
  .progress,
  .controls,
  .game-title,
  .timeago {
    z-index: 4;
  }

  .controls {
    &.small {
      align-self: flex-start;
    }
  }

  .game-title {
    font-weight: bold;

    .game-file-name {
      display: inline;
      font-weight: normal;
    }
  }

  .cover,
  .progress {
    transition: -webkit-filter 1s;
  }

  &.dimmed {
    .cover,
    .progress,
    .timeago {
      filter: grayscale(100%) brightness(50%);
    }

    .controls,
    .game-title {
      color: $secondary-text-color;
    }

    .stats {
      color: darken($secondary-text-color, 10%);
    }
  }

  .game-title {
    ${styles.singleLine()} max-width: 500px;
  }

  .timeago {
    font-size: 80%;
    color: $secondary-text-color;
    display: flex;
    flex-direction: row;

    .filler {
      flex-grow: 1;
      min-width: 20px;
    }
  }

  display: flex;
  align-items: center;

  .stats {
    flex-grow: 1;
    height: $download-cover-height;
    display: flex;
    align-items: center;

    .stats-inner {
      width: 100%;
    }

    .progress {
      ${styles.progress()};
      margin: 10px 0;
      height: 5px;
      overflow: hidden;

      &,
      .progress-inner {
        border-radius: 5px;
      }

      .progress-inner.indeterminate {
        animation: ${styles.animations.horizontalIndeterminate} 2.4s ease-in-out
          infinite;
      }
    }
  }

  .stats--control {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .control--title {
    padding-bottom: 0.5em;
    font-weight: bold;
  }

  .control--filename {
    display: inline;
    font-weight: normal;
  }

  .control--reason {
    font-weight: normal;
    color: ${props => props.theme.secondaryText};
  }
`;

const StyledCover = styled(Cover)`
  flex-shrink: 0;
  width: 105px;
  height: 80px;
  padding-bottom: 0;

  margin-right: 16px;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 8px;
`;

class DownloadRow extends React.PureComponent<IProps & IDerivedProps> {
  constructor() {
    super();
    this.state = {};
  }

  onCoverContextMenu = (ev: React.MouseEvent<any>) => {
    const { item, openGameContextMenu } = this.props;
    const { game } = item;
    openGameContextMenu({ game, clientX: ev.clientX, clientY: ev.pageY });
  };

  onNavigate = (ev: React.MouseEvent<any>) => {
    const { item, navigateToGame } = this.props;
    if (ev.shiftKey && ev.ctrlKey) {
      const { openModal } = this.props;
      openModal(
        modalWidgets.exploreJson.make({
          title: "Download data",
          message: "",
          widgetParams: {
            data: item,
          },
        })
      );
      return;
    }

    const background = doesEventMeanBackground(ev);
    const { game } = item;
    navigateToGame({ game, background });
  };

  render() {
    const { first, finished, item, speeds } = this.props;

    const { game } = item;
    const { coverUrl, stillCoverUrl } = game;

    let onStatsClick = (ev: React.MouseEvent<any>): void => null;
    if (finished) {
      // TODO: figure this out with buse
      let err = null;
      if (err) {
        onStatsClick = this.onShowError;
      } else {
        onStatsClick = this.onNavigate;
      }
    }

    const itemClasses = classNames("download-row-item", {
      first,
      dimmed: !finished && !first,
      finished,
    });

    const { hover, onMouseEnter, onMouseLeave } = this.props;

    return (
      <DownloadRowDiv
        className={itemClasses}
        data-game-id={item.game.id}
        onContextMenu={this.onCoverContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {first ? <Chart data={speeds} /> : null}

        <StyledCover
          hover={hover}
          coverUrl={coverUrl}
          stillCoverUrl={stillCoverUrl}
          gameId={game.id}
          onClick={this.onNavigate}
        />
        <div className="stats" onClick={onStatsClick}>
          {this.progress()}
        </div>
        {this.controls()}
      </DownloadRowDiv>
    );
  }

  onDiscard = () => {
    const { id } = this.props.item;
    this.props.discardDownloadRequest({ id });
  };

  onPrioritize = () => {
    const { id } = this.props.item;
    this.props.prioritizeDownload({ id });
  };

  onResume = () => {
    this.props.resumeDownloads({});
  };

  onPause = () => {
    this.props.pauseDownloads({});
  };

  onShowError = (ev: React.MouseEvent<any>) => {
    ev.stopPropagation();

    const { id } = this.props.item;
    this.props.showDownloadError({ id });
  };

  controls() {
    const { first, status } = this.props;
    // TODO: figure this out with buse
    let err = null;

    if (!status.operation && err) {
      return null;
    }

    if (!status.operation) {
      return (
        <div className="controls small">
          <IconButton
            icon="cross"
            hintPosition="left"
            hint={["status.downloads.clear_finished"]}
            onClick={this.onDiscard}
          />
        </div>
      );
    }

    return (
      <Controls>
        {first ? (
          status.operation.paused ? (
            <IconButton big icon="triangle-right" onClick={this.onResume} />
          ) : (
            <IconButton big icon="pause" onClick={this.onPause} />
          )
        ) : (
          <IconButton
            big
            hint={["grid.item.prioritize_download"]}
            icon="caret-up"
            onClick={this.onPrioritize}
          />
        )}
        <IconButton
          big
          hintPosition="left"
          hint={["grid.item.discard_download"]}
          icon="cross"
          onClick={this.onDiscard}
        />
      </Controls>
    );
  }

  progress() {
    const { first, finished, item, status, downloadsPaused } = this.props;
    // TODO: figure this out with buse
    let err = null;
    let reason = "TODO: figure this out with buse";
    const { game, upload, finishedAt } = item;
    const { operation } = status;

    if (finished && !operation) {
      if (err) {
        return (
          <div className="stats--control">
            <div className="control--title">
              {game.title}
              <span className="control--reason">
                {" — "}
                {format(["prompt.install_error.message"])}
              </span>
            </div>
            <Button
              icon="error"
              primary
              discreet
              label={format(["grid.item.view_details"])}
              onClick={this.onShowError}
            />
          </div>
        );
      }

      const outcomeText = formatOutcome(reason);
      return (
        <div className="stats--control">
          <div className="control--title">
            {game.title}
            <div className="control--filename">
              {upload ? ` · ${formatUploadTitle(upload)}` : null}
            </div>
            {outcomeText ? (
              <span className="control--reason">
                {" — "}
                {format(outcomeText)}
              </span>
            ) : null}{" "}
            <TimeAgo className="control--reason" date={finishedAt} />
          </div>
          <MainAction game={game} status={status} />
        </div>
      );
    }

    const { progress = 0, bps, eta } = status.operation;

    const progressInnerStyle: React.CSSProperties = {};
    const positiveProgress = progress > 0;
    const hasNonDownloadTask =
      operation && operation.type !== OperationType.Download;
    const indeterminate =
      (first || hasNonDownloadTask) && !downloadsPaused && !positiveProgress;
    if (indeterminate) {
      progressInnerStyle.width = `${100 / 3}%`;
    } else {
      progressInnerStyle.width = `${progress * 100}%`;
    }

    return (
      <div className="stats-inner">
        <div className="game-title">
          {game.title}
          <div className="game-file-name">
            {upload ? ` · ${formatUploadTitle(upload)}` : null}
          </div>
        </div>
        <div className="progress">
          <div
            className={classNames("progress-inner", {
              indeterminate,
            })}
            style={progressInnerStyle}
          />
        </div>
        <div className="timeago">
          {this.formatTimeAgo()}
          <div className="filler" />
          <div>
            {operation.paused ? (
              first ? (
                <div className="paused">
                  {format(["grid.item.downloads_paused"])}
                </div>
              ) : null
            ) : (first || operation) && eta >= 0 && bps ? (
              <span>{downloadProgress({ eta, bps }, operation.paused)}</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
  formatTimeAgo() {
    const { status } = this.props;
    const { operation } = status;

    if (operation.paused) {
      return format(["grid.item.queued"]);
    }

    return <div>{this.formatOperation(operation)}</div>;
  }

  formatOperation(op: IOperation): string | JSX.Element {
    if (op.type === OperationType.Download) {
      const { item } = this.props;
      const reasonText = formatReason(op.reason);
      return (
        <span>
          {format(["download.started"])}{" "}
          <TimeAgo date={new Date(item.startedAt)} />
          {reasonText ? (
            <span>
              {" — "}
              {format(reasonText)}
            </span>
          ) : (
            ""
          )}
        </span>
      );
    }

    return format(formatOperation(op));
  }
}

interface IProps extends IHoverProps {
  // TODO: first really means active, active really means !finished
  first?: boolean;
  finished?: boolean;
  item: Download;
}

const actionCreators = actionCreatorsList(
  "navigateToGame",
  "prioritizeDownload",
  "showDownloadError",
  "pauseDownloads",
  "resumeDownloads",
  "discardDownloadRequest",
  "openGameContextMenu",
  "openModal"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  status: IGameStatus;
  speeds: IDownloadSpeeds;

  downloadsPaused: boolean;
  tasksByGameId: {
    [gameId: string]: ITask[];
  };
  itemProgress: DownloadProgress;
};

const HoverDownloadRow = Hover(DownloadRow);

export default connect<IProps>(HoverDownloadRow, {
  state: (rs: IRootState, props: IProps) => {
    const game = props.item.game;

    return {
      speeds: rs.downloads.speeds,
      downloadsPaused: rs.downloads.paused,
      tasksByGameId: rs.tasks.tasksByGameId,
      status: getGameStatus(rs, game),
      downloadProgress: rs.downloads.progresses[props.item.id],
    };
  },
  actionCreators,
});
