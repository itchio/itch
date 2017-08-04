import * as React from "react";
import * as classNames from "classnames";
import { connect } from "./connect";
import bob, { IRGBColor } from "../renderer-util/bob";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

import { truncate, downloadProgress, fileSize } from "../format";

import * as actions from "../actions";

import TimeAgo from "./basics/time-ago";
import IconButton from "./basics/icon-button";
import Hover, { IHoverProps } from "./basics/hover-hoc";
import Cover from "./basics/cover";
import GameActions from "./game-actions";

import { IDownloadSpeeds, IDownloadItem, ITask } from "../types";
import { dispatcher } from "../constants/action-types";

import styled, * as styles from "./styles";

import format, { formatString } from "./format";
import { injectIntl, InjectedIntl } from "react-intl";

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

  .recharts-responsive-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  &.finished {
    cursor: pointer;
  }

  &.first,
  &:hover {
    background-color: ${props => props.theme.explanation};
  }

  .cover,
  .progress,
  .controls,
  .game-title,
  .timeago {
    z-index: 4;
  }

  .game-title {
    font-weight: bold;
  }

  .cover,
  .progress {
    transition: -webkit-filter 1s;
  }

  &.dimmed {
    .cover,
    .progress,
    .timeago {
      -webkit-filter: grayscale(100%) brightness(50%);
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
      ${styles.progress()} margin: 10px 0;
      height: 5px;

      &,
      .progress-inner {
        border-radius: 5px;
      }
    }
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

class DownloadRow extends React.PureComponent<IProps & IDerivedProps, IState> {
  constructor() {
    super();
    this.state = {};
  }

  onCoverContextMenu = () => {
    const { item, openGameContextMenu } = this.props;
    const { game } = item;
    openGameContextMenu({ game });
  };

  onNavigate = () => {
    const { item, navigateToGame } = this.props;
    navigateToGame(item.game);
  };

  render() {
    const { first, active, item, navigateToGame, speeds } = this.props;

    const { game } = item;
    const { coverUrl, stillCoverUrl } = game;

    let onStatsClick = (): void => null;
    if (!active) {
      onStatsClick = this.onNavigate;
    }

    const itemClasses = classNames({
      first,
      dimmed: active && !first,
      finished: !active,
    });

    const gradientColor = "rgb(158, 150, 131)";

    const { hover, onMouseEnter, onMouseLeave } = this.props;

    return (
      <DownloadRowDiv
        className={itemClasses}
        onContextMenu={this.onCoverContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {first
          ? <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={speeds}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="downloadGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={gradientColor}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="50%"
                      stopColor={gradientColor}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="100%"
                      stopColor={gradientColor}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  curve={false}
                  dot={false}
                  isAnimationActive={false}
                  dataKey="bps"
                  fill="url(#downloadGradient)"
                  fillOpacity={1.0}
                />
              </AreaChart>
            </ResponsiveContainer>
          : ""}

        <StyledCover
          hover={hover}
          coverUrl={coverUrl}
          stillCoverUrl={stillCoverUrl}
          onClick={() => navigateToGame(game)}
        />
        <div className="stats" onClick={onStatsClick}>
          {this.progress()}
        </div>
        {this.controls()}
      </DownloadRowDiv>
    );
  }

  controls() {
    const {
      intl,
      active,
      first,
      item,
      retryDownload,
      downloadsPaused,
    } = this.props;
    const {
      resumeDownloads,
      pauseDownloads,
      prioritizeDownload,
      cancelDownload,
    } = this.props;
    const { id, err } = item;

    if (!active && err) {
      return (
        <div className="controls">
          <span
            className="icon icon-repeat"
            onClick={() => retryDownload({ id })}
          />
        </div>
      );
    }

    if (!active) {
      return (
        <div className="controls">
          <IconButton
            big
            icon="delete"
            hintPosition="left"
            hint={formatString(intl, ["status.downloads.clear_finished"])}
            onClick={() => cancelDownload({ id })}
          />
        </div>
      );
    }

    return (
      <Controls>
        {first
          ? downloadsPaused
            ? <IconButton
                big
                icon="triangle-right"
                onClick={() => resumeDownloads({})}
              />
            : <IconButton big icon="pause" onClick={() => pauseDownloads({})} />
          : <IconButton
              big
              hint={formatString(intl, ["grid.item.prioritize_download"])}
              icon="caret-up"
              onClick={() => prioritizeDownload({ id })}
            />}
        <IconButton
          big
          hintPosition="left"
          hint={formatString(intl, ["grid.item.cancel_download"])}
          icon="cross"
          onClick={() => cancelDownload({ id })}
        />
      </Controls>
    );
  }

  progress() {
    const { first, active, item, downloadsPaused, tasksByGameId } = this.props;
    const { err } = item;

    const { game } = item;
    const task = (tasksByGameId[game.id] || [])[0];

    if (!active && !task) {
      if (err) {
        return (
          <div className="error-message">
            {format(["status.downloads.download_error"])}
            <div className="timeago" data-rh-at="top" data-rh={err}>
              {truncate(err, { length: 60 })}
            </div>
          </div>
        );
      }

      return (
        <div>
          {game.title}
          <GameActions game={game} />
        </div>
      );
    }

    const { startedAt, reason } = item;
    let { progress = 0, bps, eta } = item;

    if (task) {
      progress = task.progress;
    }

    const progressInnerStyle: React.CSSProperties = {
      width: progress * 100 + "%",
    };
    const { dominantColor } = this.state;
    if (dominantColor) {
      progressInnerStyle.backgroundColor = bob.toCSS(dominantColor);
    }

    const reasonText = this.formattedReason(reason);

    return (
      <div className="stats-inner">
        <div className="game-title">
          {game.title}
        </div>
        <div className="progress">
          <div className="progress-inner" style={progressInnerStyle} />
        </div>
        <div className="timeago">
          {task
            ? task.name === "launch"
              ? format(["grid.item.running"])
              : format(["grid.item.installing"])
            : first
              ? downloadsPaused
                ? null
                : <div>
                    {format(["download.started"])}{" "}
                    <TimeAgo date={new Date(startedAt)} />
                    {reasonText
                      ? <span>
                          {" — "}
                          {reasonText}
                        </span>
                      : ""}
                    {item.totalSize ? ` — ${fileSize(item.totalSize)}` : ""}
                  </div>
              : format(["grid.item.queued"])}
          <div className="filler" />
          <div>
            {downloadsPaused
              ? first
                ? <div className="paused">
                    {format(["grid.item.downloads_paused"])}
                  </div>
                : null
              : (first || task) && eta && bps
                ? <span>
                    {downloadProgress({ eta, bps }, downloadsPaused)}
                  </span>
                : null}
          </div>
        </div>
      </div>
    );
  }

  formattedReason(reason: string) {
    switch (reason) {
      case "update":
        return format(["download.reason.update"]);
      case "reinstall":
        return format(["download.reason.reinstall"]);
      case "revert":
        return format(["download.reason.revert"]);
      case "heal":
        return format(["download.reason.heal"]);
      default:
        return null;
    }
  }

  componentDidMount() {
    const { item } = this.props;
    const { game } = item;
    const { coverUrl } = game;

    bob.extractPalette(coverUrl, palette => {
      this.setState({ dominantColor: bob.pick(palette) });
    });
  }
}

interface IProps extends IHoverProps {
  // TODO: first really means active, active really means !finished
  first?: boolean;
  active?: boolean;
  item: IDownloadItem;
}

interface IDerivedProps {
  speeds: IDownloadSpeeds;

  downloadsPaused: boolean;
  tasksByGameId: {
    [gameId: string]: ITask[];
  };

  navigateToGame: typeof actions.navigateToGame;
  prioritizeDownload: typeof actions.prioritizeDownload;
  pauseDownloads: typeof actions.pauseDownloads;
  resumeDownloads: typeof actions.resumeDownloads;
  retryDownload: typeof actions.retryDownload;
  cancelDownload: typeof actions.cancelDownload;
  openGameContextMenu: typeof actions.openGameContextMenu;

  intl: InjectedIntl;
}

interface IState {
  dominantColor?: IRGBColor;
}

const HoverDownloadRow = Hover(DownloadRow);

export default connect<IProps>(injectIntl(HoverDownloadRow), {
  state: state => ({
    speeds: state.downloads.speeds,
    downloadsPaused: state.downloads.paused,
    tasksByGameId: state.tasks.tasksByGameId,
  }),
  dispatch: dispatch => ({
    navigateToGame: dispatcher(dispatch, actions.navigateToGame),
    prioritizeDownload: dispatcher(dispatch, actions.prioritizeDownload),
    pauseDownloads: dispatcher(dispatch, actions.pauseDownloads),
    resumeDownloads: dispatcher(dispatch, actions.resumeDownloads),
    retryDownload: dispatcher(dispatch, actions.retryDownload),
    cancelDownload: dispatcher(dispatch, actions.cancelDownload),
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
