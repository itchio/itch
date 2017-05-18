
import * as React from "react";
import {connect, I18nProps} from "../connect";

import {first, find} from "underscore";

import TaskIcon from "../basics/task-icon";
import LoadingCircle from "../basics/loading-circle";
import Button from "../basics/button";

import format from "../../util/format";
import * as actions from "../../actions";

import {IActionsInfo} from "./types";

import {IGameUpdate, IDownloadItem} from "../../types";
import {dispatcher} from "../../constants/action-types";

interface IStatus {
  status: string;
  statusTask?: string;
}

class MainAction extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, platform, platformCompatible, mayDownload,
      pressDownload, canBeBought, tasks, action, cave, className} = this.props;

    let progress = 0;
    let task: string;
    const activeDownload = this.activeDownload();
    const firstTask = first(tasks);
    if (activeDownload) {
      task = "download";
      progress = activeDownload.progress;
    } else if (firstTask) {
      task = firstTask.name;
      progress = firstTask.progress;
    } else if (cave) {
      task = "idle";
    }

    let icon: string;
    let iconComponent: JSX.Element;
    let label: string;
    let primary: boolean;

    if (task) {
      const {status, statusTask} = this.status(task);
      const realTask = statusTask || task;

      const hasProgress = progress > 0 || realTask === "find-upload" || realTask === "download" ||
          realTask === "configure" || realTask === "install";
      if (hasProgress) {
        iconComponent = <LoadingCircle progress={progress}/>;
      } else {
        iconComponent = <TaskIcon task={realTask} action={action}/>;
        if (realTask === "idle") {
          primary = true;
        }
      }
      label = status;
    } else {
      if (platformCompatible) {
        if (mayDownload) {
          icon = "install";
          label = t("grid.item." + (pressDownload ? "review" : "install"));
        } else if (canBeBought) {
          icon = "shopping_cart";
          label = t("grid.item.buy_now");
          primary = true;
        }
      } else {
        return <span className="state not-platform-compatible">
          {t("grid.item.not_platform_compatible", {platform: format.itchPlatform(platform)})}
        </span>;
      }
    }

    const hint = this.hint(task);

    if (!label) {
      return <div/>;
    }

    return <Button
      className={className}
      icon={icon}
      discreet
      iconComponent={iconComponent}
      label={label}
      primary={primary}
      onClick={(e) => this.onClick(e, task)}
      hint={hint}/>;
  }

  activeDownload(): IDownloadItem | null {
    return find(this.props.downloads, (d) => !d.finished);
  }

  hint (task: string) {
    const {t} = this.props;

    if (task === "error") {
      return t("grid.item.report_problem");
    }
  }

  onClick (e: React.MouseEvent<HTMLElement>, task: string) {
    e.stopPropagation();

    let {cave, game, platformCompatible, mayDownload, update} = this.props;
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

  status (task: string): IStatus {
    const {t, action} = this.props;

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
      res = {status: t("grid.item.downloading")};
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

  update: IGameUpdate;
  className?: string;
}

interface IDerivedProps {
  downloadsPaused: boolean;

  queueGame: typeof actions.queueGame;
  showGameUpdate: typeof actions.showGameUpdate;
  initiatePurchase: typeof actions.initiatePurchase;
  abortGameRequest: typeof actions.abortGameRequest;
  navigate: typeof actions.navigate;
}

export default connect<IProps>(MainAction, {
  state: (state) => ({
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
