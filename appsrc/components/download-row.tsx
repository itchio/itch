
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";
import bob, {IRGBColor} from "../renderer-util/bob";
import {ResponsiveContainer, AreaChart, Area} from "recharts";

import downloadProgress from "../util/download-progress";

import * as actions from "../actions";

import NiceAgo from "./nice-ago";
import GameActions from "./game-actions";

import {IState, IDownloadSpeeds, IDownloadItem, ITask} from "../types";
import {IDispatch, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

import * as format from "../util/format";

class DownloadRow extends React.Component<IDownloadRowProps, IDownloadRowState> {
  constructor () {
    super();
    this.state = {};
    this.onCoverContextMenu = this.onCoverContextMenu.bind(this);
  }

  onCoverContextMenu () {
    const {item, openGameContextMenu} = this.props;
    const {game} = item;
    openGameContextMenu({game});
  }

  render () {
    const {first, active, item, navigateToGame, speeds} = this.props;

    const {game, id} = item;
    const coverUrl = game.stillCoverUrl || game.coverUrl;
    const coverStyle: React.CSSProperties = {};
    if (coverUrl) {
      coverStyle.backgroundImage = `url("${coverUrl}")`;
    }

    let onStatsClick = (): void => null;
    if (!active) {
      onStatsClick = () => navigateToGame(game);
    }

    const itemClasses = classNames("history-item", {first, dimmed: (active && !first), finished: !active});

    const gradientColor = "rgb(158, 150, 131)";

    return <li key={id} className={itemClasses}>
      {first
      ? <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={speeds} margin={{top: 0, right: 0, left: 0, bottom: 0}}>
          <defs>
            <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity={0.2}/>
              <stop offset="50%" stopColor={gradientColor} stopOpacity={0.2}/>
              <stop offset="100%" stopColor={gradientColor} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <Area type="monotone" curve={false} dot={false} isAnimationActive={false}
            dataKey="bps" fill="url(#downloadGradient)" fillOpacity={1.0}/>
        </AreaChart>
      </ResponsiveContainer>
      : ""
      }

      <div className="cover" style={coverStyle}
        onClick={() => navigateToGame(game)}
        onContextMenu={this.onCoverContextMenu}/>
      <div className="stats" onClick={() => { onStatsClick(); }}>
        {this.progress()}
      </div>
      {this.controls()}
    </li>;
  }

  controls () {
    const {t, active, first, item, retryDownload, downloadsPaused} = this.props;
    const {resumeDownloads, pauseDownloads, prioritizeDownload, cancelDownload} = this.props;
    const {id, err} = item;

    if (!active && err) {
      return <div className="controls">
        <span className="icon icon-repeat" onClick={() => retryDownload({downloadOpts: item.downloadOpts})}></span>
      </div>;
    }

    if (!active) {
      return <div className="controls">
        <span data-rh-at="left" data-rh={t("status.downloads.clear_finished")}>
          <span className="icon icon-delete" onClick={() => cancelDownload({id})}/>
        </span>
      </div>;
    }

    return <div className="controls">
    {first
      ? (downloadsPaused
        ? <span className="icon icon-triangle-right" onClick={() => resumeDownloads({})}/>
        : <span className="icon icon-pause" onClick={() => pauseDownloads({})}/>
      )
      : <span data-rh-at="left" data-rh={t("grid.item.prioritize_download")}>
        <span className="icon icon-caret-up" onClick={() => prioritizeDownload({id})}/>
      </span>
    }
      <span data-rh-at="left" data-rh={t("grid.item.cancel_download")}>
        <span className="icon icon-cross" onClick={() => cancelDownload({id})}/>
      </span>
    </div>;
  }

  progress () {
    const {t, first, active, item, downloadsPaused, tasksByGameId} = this.props;
    const {err} = item;

    const {game} = item;
    const task = (tasksByGameId[game.id] || [])[0];

    if (!active && !task) {
      if (err) {
        return <div className="error-message">
          {t("status.downloads.download_error")}
          <div className="timeago" data-rh-at="top" data-rh={err}>
            {format.truncate(err, {length: 60})}
          </div>
        </div>;
      }

      return <div>
        {game.title}
        <GameActions game={game}/>
      </div>;
    }

    const {date, reason} = item;
    let {progress = 0, bps, eta} = item;

    if (task) {
      progress = task.progress;
    }

    const progressInnerStyle: React.CSSProperties = {
      width: (progress * 100) + "%",
    };
    const {dominantColor} = this.state;
    if (dominantColor) {
      progressInnerStyle.backgroundColor = bob.toCSS(dominantColor);
    }

    const reasonText = this.reasonText(reason);

    return <div className="stats-inner">
      <div className="game-title">{game.title}</div>
      <div className="progress">
        <div className="progress-inner" style={progressInnerStyle}/>
      </div>
      <div className="timeago">
      {task
      ? (task.name === "launch"
        ? t("grid.item.running")
        : t("grid.item.installing")
      )
      : (first
      ? <div>
        {t("download.started")} <NiceAgo date={date}/>
        {reasonText ? ` — ${reasonText}` : ""}
      </div>
      : t("grid.item.queued")
      )}
        <div className="filler"/>
        <div>
        {downloadsPaused
        ? <div className="paused">{t("grid.item.downloads_paused")}</div>
        : (((first || task) && eta && bps)
          ? <span>{downloadProgress(t, {eta, bps}, downloadsPaused)}</span>
          : ""
        )}
        </div>
      </div>
    </div>;
  }

  reasonText (reason: string) {
    const {t} = this.props;

    switch (reason) {
      case "update":
        return t("download.reason.update");
      case "reinstall":
        return t("download.reason.reinstall");
      case "revert":
        return t("download.reason.revert");
      case "heal":
        return t("download.reason.heal");
      default:
        return "";
    }
  }

  componentDidMount () {
    const {item} = this.props;
    const {game} = item;
    const {coverUrl} = game;

    bob.extractPalette(coverUrl, (palette) => {
      this.setState({dominantColor: bob.pick(palette)});
    });
  }
}

interface IDownloadRowProps {
  first: boolean;
  active: boolean;
  item: IDownloadItem;
  speeds: IDownloadSpeeds;

  downloadsPaused: boolean;
  tasksByGameId: {
    [gameId: string]: ITask[];
  };

  t: ILocalizer;

  navigateToGame: typeof actions.navigateToGame;
  prioritizeDownload: typeof actions.prioritizeDownload;
  pauseDownloads: typeof actions.pauseDownloads;
  resumeDownloads: typeof actions.resumeDownloads;
  retryDownload: typeof actions.retryDownload;
  cancelDownload: typeof actions.cancelDownload;
  openGameContextMenu: typeof actions.openGameContextMenu;
}

interface IDownloadRowState {
  dominantColor?: IRGBColor;
}

const mapStateToProps = (state: IState) => ({
  speeds: state.downloads.speeds,
  downloadsPaused: state.downloads.downloadsPaused,
  tasksByGameId: state.tasks.tasksByGameId,
});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  navigateToGame: dispatcher(dispatch, actions.navigateToGame),
  prioritizeDownload: dispatcher(dispatch, actions.prioritizeDownload),
  pauseDownloads: dispatcher(dispatch, actions.pauseDownloads),
  resumeDownloads: dispatcher(dispatch, actions.resumeDownloads),
  retryDownload: dispatcher(dispatch, actions.retryDownload),
  cancelDownload: dispatcher(dispatch, actions.cancelDownload),
  openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DownloadRow);
