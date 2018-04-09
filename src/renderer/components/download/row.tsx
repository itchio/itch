import React from "react";
import classNames from "classnames";
import { connect, Dispatchers, actionCreatorsList } from "../connect";
import Chart from "./chart";

import TimeAgo from "../basics/time-ago";
import UploadIcon from "../basics/upload-icon";
import IconButton from "../basics/icon-button";
import Button from "../basics/button";
import Hover, { IHoverProps } from "../basics/hover-hoc";
import Cover from "../basics/cover";
import MainAction from "../game-actions/main-action";

import { ITask, IRootState } from "common/types";

import styled, * as styles from "../styles";
import { css } from "../styles";

import { T } from "renderer/t";
import { doesEventMeanBackground } from "../when-click-navigates";
import getGameStatus, {
  IGameStatus,
  IOperation,
  OperationType,
} from "common/helpers/get-game-status";
import {
  formatReason,
  formatOutcome,
  formatOperation,
} from "common/format/operation";
import { formatUploadTitle } from "common/format/upload";
import { modalWidgets } from "../modal-widgets/index";
import { Download } from "common/butlerd/messages";
import LoadingCircle from "../basics/loading-circle";
import { lighten } from "polished";
import { downloadProgress } from "common/format/download-progress";
import { formatError, getDownloadError } from "common/format/errors";

const DownloadRowDiv = styled.div`
  font-size: ${props => props.theme.fontSizes.large};
  position: relative;

  border: 1px solid transparent;
  transition: all 0.4s;

  background-color: ${props => props.theme.inputBackground};
  padding: 10px;
  margin: 10px 0;

  &.first {
    padding-bottom: 14px;
  }

  &.has-operation {
    background-color: ${props => lighten(0.05, props.theme.inputBackground)};
    border-color: ${props => lighten(0.2, props.theme.inputBackground)};
  }

  display: flex;
  flex-direction: row;
  align-items: center;

  .stats {
    flex-grow: 1;
  }

  .stats--control {
    .control-title,
    .control--details {
      white-space: nowrap;
      max-width: 500px;
      text-overflow: ellipsis;
    }

    .control--title {
      padding: 0.4em 0;
      padding-bottom: 0;
      font-size: ${props => props.theme.fontSizes.larger};
      font-weight: bold;
    }

    .control--details,
    .control--status {
      font-size: ${props => props.theme.fontSizes.baseText};

      display: flex;
      flex-direction: row;
      align-items: center;

      padding: 0.4em 0;
    }

    .control--error {
      padding: 0.4em 0;
      line-height: 1.4;

      max-width: 500px;

      color: ${props => props.theme.baseColors.carnation};
    }

    .control--details {
      color: ${props => props.theme.secondaryText};
    }

    .progress {
      ${styles.progress()};

      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 4px;

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

  &:not(.first) {
    .progress {
      display: none;
    }
  }
`;

const Filler = styled.div`
  flex-grow: 1;
`;

const Spacer = styled.div`
  height: 1px;
  min-width: 8px;
`;

const coverStyle = () => css`
  flex-shrink: 0;
  width: 105px;
  height: 80px;
  padding-bottom: 0;

  margin-right: 16px;
`;

const StyledCover = styled(Cover)`
  ${coverStyle()};

  &.hasError {
    filter: grayscale(100%);
  }
`;

const Controls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 8px;
`;

class DownloadRow extends React.PureComponent<IProps & IDerivedProps> {
  constructor(props: IProps & IDerivedProps, context: any) {
    super(props, context);
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

    const itemClasses = classNames("download-row-item", {
      first,
      dimmed: !finished && !first,
      finished,
      ["has-operation"]: !!this.props.status.operation,
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
          className={classNames({ hasError: !!item.error })}
        />
        <div className="stats">{this.progress()}</div>
        {this.controls()}
      </DownloadRowDiv>
    );
  }

  onDiscard = () => {
    const { id } = this.props.item;
    this.props.discardDownload({ id });
  };

  onPrioritize = () => {
    const { id } = this.props.item;
    this.props.prioritizeDownload({ id });
  };

  onShowError = (ev: React.MouseEvent<any>) => {
    ev.stopPropagation();

    const { id } = this.props.item;
    this.props.showDownloadError({ id });
  };

  controls() {
    const { first, status, item } = this.props;
    if (!status.operation && item.error) {
      return (
        <Controls>
          <Button
            label={T(["grid.item.view_details"])}
            onClick={this.onShowError}
          />
        </Controls>
      );
    }

    let showPrioritize = !item.finishedAt && !first;
    let showMainAction =
      !status.operation || status.operation.type !== OperationType.Download;

    return (
      <Controls>
        {showPrioritize ? (
          <IconButton
            big
            hint={["grid.item.prioritize_download"]}
            icon="caret-up"
            onClick={this.onPrioritize}
          />
        ) : null}
        {showMainAction ? (
          <>
            <MainAction game={item.game} status={status} />
            <Spacer />
          </>
        ) : (
          <IconButton
            big
            hintPosition="left"
            hint={["grid.item.discard_download"]}
            icon="cross"
            onClick={this.onDiscard}
          />
        )}
      </Controls>
    );
  }

  progress() {
    const { first, finished, status, downloadsPaused } = this.props;
    const { operation } = status;

    if (finished) {
      return (
        <div className="stats--control">
          {this.renderTitle()}
          {this.renderDetails()}
          {this.renderErrorOrTimestamp()}
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
    if (this.props.downloadsPaused) {
      progressInnerStyle.filter = "grayscale(100%)";
    }

    return (
      <div className="stats--control">
        {this.renderTitle()}
        {this.renderDetails()}
        <div className="progress">
          <div
            className={classNames("progress-inner", {
              indeterminate,
            })}
            style={progressInnerStyle}
          />
        </div>
        <div className="control--status">
          {this.renderStatus()}
          <Filler />
          <>
            {!operation.paused && first && eta >= 0 && bps ? (
              <>
                <Spacer />
                {downloadProgress({ eta, bps }, operation.paused)}
              </>
            ) : null}
          </>
        </div>
      </div>
    );
  }

  renderTitle(): JSX.Element {
    const { game } = this.props.item;
    return (
      <div className="control--title">
        <strong>{game.title}</strong>
      </div>
    );
  }

  renderDetails(): JSX.Element {
    return <div className="control--details">{this.renderUpload()}</div>;
  }

  renderErrorOrTimestamp(): JSX.Element {
    const { error, finishedAt, reason } = this.props.item;

    if (!error) {
      const outcomeText = formatOutcome(reason);
      return (
        <div className="control--status">
          <TimeAgo date={finishedAt} />
          {outcomeText ? (
            <>
              <Spacer />
              {"—"}
              <Spacer />
              {T(outcomeText)}
            </>
          ) : null}
        </div>
      );
    }

    return (
      <div className="control--error">
        {T(["prompt.install_error.title"])}{" "}
        {T(formatError(getDownloadError(this.props.item)))}
      </div>
    );
  }

  renderUpload(): JSX.Element {
    const { item } = this.props;
    const { upload } = item;

    return (
      <>
        <UploadIcon upload={upload} />
        <Spacer />
        {formatUploadTitle(upload)}
      </>
    );
  }

  renderStatus() {
    const { status, first } = this.props;
    const { operation } = status;

    if (operation.paused || !first) {
      return T(["grid.item.queued"]);
    }

    return this.formatOperation(operation);
  }

  formatOperation(op: IOperation): string | JSX.Element {
    if (op.type === OperationType.Download) {
      const { item } = this.props;
      const reasonText = formatReason(op.reason);
      return (
        <>
          <TimeAgo
            before={T(["download.started"])}
            date={new Date(item.startedAt)}
          />
          {op.stage ? (
            <>
              <Spacer />
              {"—"}
              <Spacer />
              {op.stage}
            </>
          ) : null}
          {reasonText ? (
            <>
              <Spacer />
              {"—"}
              <Spacer />
              {T(reasonText)}
            </>
          ) : (
            ""
          )}
        </>
      );
    }

    return (
      <>
        <LoadingCircle progress={op.progress} />
        {T(formatOperation(op))}
      </>
    );
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
  "discardDownload",
  "openGameContextMenu",
  "openModal"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  status: IGameStatus;
  speeds: number[];

  downloadsPaused: boolean;
  tasksByGameId: {
    [gameId: string]: ITask[];
  };
};

const HoverDownloadRow = Hover(DownloadRow);

export default connect<IProps>(HoverDownloadRow, {
  state: (rs: IRootState, props: IProps) => {
    const game = props.item.game;

    return {
      speeds: rs.downloads.speeds,
      downloadsPaused: rs.downloads.paused,
      tasksByGameId: rs.tasks.tasksByGameId,
      status: getGameStatus(rs, game, props.item.caveId),
    };
  },
  actionCreators,
});
