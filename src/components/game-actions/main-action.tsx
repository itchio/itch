
import * as React from "react";
import {connect, I18nProps} from "../connect";
import * as classNames from "classnames";

import Icon from "../basics/icon";
import TaskIcon from "../basics/task-icon";
import LoadingCircle from "../basics/loading-circle";

import format from "../../util/format";
import downloadProgress from "../../util/download-progress";

import * as actions from "../../actions";

import {IActionsInfo} from "./types";

import {IDownloadItem, ICaveRecord, IGameUpdate} from "../../types";
import {dispatcher} from "../../constants/action-types";

import Ink = require("react-ink");

interface IStatus {
  status: string;
  statusTask?: string;
  hint?: string;
}

class MainAction extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, cancellable, platform, platformCompatible, mayDownload,
      pressDownload, canBeBought, progress, task, action, animate, cave} = this.props;

    let child: React.ReactElement<any> | null = null;
    if (task) {
      const {status, hint, statusTask} = this.status();
      const classes = classNames("state", "normal-state");

      const realTask = statusTask || task;

      child = <span className={classes} data-rh-at="top" data-rh={hint}>
        { (
            progress > 0 || realTask === "find-upload" || realTask === "download" ||
            realTask === "configure" || realTask === "install")
          ? <LoadingCircle progress={progress}/>
          : <TaskIcon task={realTask} animate={animate} action={action}/>
        }
        {status}
        {cancellable
        ? <span className="cancel-cross">
          <Icon icon="cross"/>
        </span>
        : ""}
      </span>;
    } else {
      if (platformCompatible) {
        if (mayDownload) {
          child = <span className="state">
            <Icon icon="install"/>
            {t("grid.item." + (pressDownload ? "review" : "install"))}
          </span>;
        } else if (canBeBought) {
          child = <span className="state">
            <Icon icon="shopping_cart"/>
            {t("grid.item.buy_now")}
          </span>;
        }
      } else {
        return <span className="state not-platform-compatible">
          {t("grid.item.not_platform_compatible", {platform: format.itchPlatform(platform)})}
        </span>;
      }
    }

    let style: React.CSSProperties = {
      position: "relative",
    };
    let branded = false;

    const hint = this.hint();

    const buttonClasses = classNames("main-action", {
      "buy-now": (platformCompatible && !mayDownload && canBeBought && !cave),
      branded,
    });
    const button = <div style={style}
        className={buttonClasses}
        onClick={(e) => this.onClick(e)}
        data-rh={hint} data-rh-at="top">
      <Ink/>
      {child}
    </div>;

    if (!child) {
      return <div/>;
    }

    return button;
  }

  hint () {
    const {t, task} = this.props;

    if (task === "error") {
      return t("grid.item.report_problem");
    }
  }

  onClick (e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();

    let {task, cave, game, platformCompatible, mayDownload, update} = this.props;
    const {navigate, queueGame, initiatePurchase, abortGameRequest, showGameUpdate} = this.props;

    if (task === "download" || task === "find-upload") {
      navigate("downloads");
    } else {
      if (platformCompatible) {
        if (task === "launch") {
          abortGameRequest({game});
        } else if (!task || task === "idle") {
          if (cave) {
            if (update) {
              showGameUpdate({caveId: cave.id, update});
            } else {
              queueGame({game});
            }
          } else if (mayDownload) {
            queueGame({game});
          } else {
            initiatePurchase({game});
          }
        }
      } else {
        // no click action
      }
    }
  }

  status (): IStatus {
    const {t, task, action} = this.props;

    if (task === "idle") {
      const update = this.props.update;
      if (update) {
        return {status: t("grid.item.update"), statusTask: "update"};
      }

      switch (action) {
        case "open":
          return {status: t("grid.item.open"), statusTask: "open"};
        case "launch":
        default:
          return {status: t("grid.item.launch")};
      }
    }

    if (task === "error" || task === "reporting") {
      return {status: ""};
    }

    if (task === "launch") {
      return {status: t("grid.item.running")};
    }

    let res: IStatus = {status: t("grid.item.installing")};
    if (task === "uninstall") {
      res = {status: t("grid.item.uninstalling")};
    }
    if (task === "download" || task === "find-upload") {
      const downloadItem = this.props.downloadsByGameId[this.props.game.id];
      if (downloadItem && downloadItem.eta && downloadItem.bps) {
        const {eta, bps} = downloadItem;
        res = {
          status: t("grid.item.downloading"),
          hint: downloadProgress(t, {eta, bps}, this.props.downloadsPaused, {}),
        };
      } else {
        res = {status: t("grid.item.downloading")};
      }
    }
    if (task === "ask-before-install") {
      res = {status: t("grid.item.finalize_installation")};
    }
    if (task === "download-queued") {
      res = {status: t("grid.item.queued")};
    }

    return res;
  }
}

interface IProps extends IActionsInfo {
  /** whether or not to animate the main action's icon (to indicate something's going on) */
  animate: boolean;
  platform: string;
  platformCompatible: boolean;
  progress: number;
  cancellable: boolean;

  pressDownload: boolean;

  cave: ICaveRecord;
  update: IGameUpdate;
}

interface IDerivedProps {
  downloadsByGameId: {
    [gameId: string]: IDownloadItem;
  };
  downloadsPaused: boolean;

  queueGame: typeof actions.queueGame;
  showGameUpdate: typeof actions.showGameUpdate;
  initiatePurchase: typeof actions.initiatePurchase;
  abortGameRequest: typeof actions.abortGameRequest;
  navigate: typeof actions.navigate;
}

export default connect<IProps>(MainAction, {
  state: (state) => ({
    downloadsByGameId: state.downloads.downloadsByGameId,
    downloadsPaused: state.downloads.downloadsPaused,
  }),
  dispatch: (dispatch) => ({
    queueGame: dispatcher(dispatch, actions.queueGame),
    showGameUpdate: dispatcher(dispatch, actions.showGameUpdate),
    initiatePurchase: dispatcher(dispatch, actions.initiatePurchase),
    abortGameRequest: dispatcher(dispatch, actions.abortGameRequest),
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
