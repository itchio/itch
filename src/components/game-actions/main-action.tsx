import * as React from "react";
import { connect } from "../connect";

import { injectIntl, InjectedIntl } from "react-intl";

import { first, find } from "underscore";

import TaskIcon from "../basics/task-icon";
import LoadingCircle from "../basics/loading-circle";
import Button from "../basics/button";

import { ItchPlatform, formatItchPlatform } from "../../format";
import * as actions from "../../actions";

import { IActionsInfo } from "./types";

import { IGameUpdate, IDownloadItem } from "../../types";
import { dispatcher } from "../../constants/action-types";

interface IStatus {
  status: string;
  statusTask?: string;
}

class MainAction extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const {
      platform,
      platformCompatible,
      mayDownload,
      pressDownload,
      canBeBought,
      tasks,
      action,
      cave,
      className,
    } = this.props;

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

    const { intl } = this.props;

    if (task) {
      const { status, statusTask } = this.status(task);
      const realTask = statusTask || task;

      const hasProgress =
        progress > 0 ||
        realTask === "download" ||
        realTask === "configure" ||
        realTask === "install";
      if (hasProgress) {
        iconComponent = (
          <LoadingCircle progress={progress > 0 ? progress : 0.1} />
        );
      } else {
        iconComponent = <TaskIcon task={realTask} action={action} />;
        if (realTask === "idle") {
          primary = true;
        }
      }
      label = status;
    } else {
      if (platformCompatible) {
        if (mayDownload) {
          icon = "install";
          label = intl.formatMessage({
            id: "grid.item." + (pressDownload ? "review" : "install"),
          });
        } else if (canBeBought) {
          icon = "shopping_cart";
          label = intl.formatMessage({ id: "grid.item.buy_now" });
        }
        primary = true;
      } else {
        return (
          <span className="state not-platform-compatible">
            {intl.formatMessage(
              { id: "grid.item.not_platform_compatible" },
              {
                platform: formatItchPlatform(platform),
              },
            )}
          </span>
        );
      }
    }

    const hint = this.hint(task);

    if (!label) {
      return <div />;
    }

    return (
      <Button
        className={className}
        icon={icon}
        discreet
        iconComponent={iconComponent}
        label={label}
        primary={primary}
        onClick={e => this.onClick(e, task)}
        hint={hint}
      />
    );
  }

  activeDownload(): IDownloadItem | null {
    return find(this.props.downloads, d => !d.finished);
  }

  hint(task: string) {
    const { intl } = this.props;

    if (task === "error") {
      return intl.formatMessage({ id: "grid.item.report_problem" });
    }
  }

  onClick(e: React.MouseEvent<HTMLElement>, task: string) {
    e.stopPropagation();

    let { cave, game, platformCompatible, mayDownload, update } = this.props;
    const {
      navigate,
      queueGame,
      initiatePurchase,
      abortGameRequest,
      showGameUpdate,
    } = this.props;

    if (task === "download") {
      navigate("downloads");
    } else {
      if (platformCompatible) {
        if (task === "launch") {
          abortGameRequest({ game });
        } else if (!task || task === "idle") {
          if (cave) {
            if (update) {
              showGameUpdate({ caveId: cave.id, update });
            } else {
              queueGame({ game });
            }
          } else if (mayDownload) {
            queueGame({ game });
          } else {
            initiatePurchase({ game });
          }
        }
      } else {
        // no click action
      }
    }
  }

  status(task: string): IStatus {
    const { intl, action } = this.props;

    if (task === "idle") {
      const update = this.props.update;
      if (update) {
        return {
          status: intl.formatMessage({ id: "grid.item.update" }),
          statusTask: "update",
        };
      }

      switch (action) {
        case "open":
          return {
            status: intl.formatMessage({ id: "grid.item.open" }),
            statusTask: "open",
          };
        case "launch":
        default:
          return { status: intl.formatMessage({ id: "grid.item.launch" }) };
      }
    }

    if (task === "error" || task === "reporting") {
      return { status: "" };
    }

    if (task === "launch") {
      return { status: intl.formatMessage({ id: "grid.item.running" }) };
    }

    let res: IStatus = {
      status: intl.formatMessage({ id: "grid.item.installing" }),
    };
    if (task === "uninstall") {
      res = { status: intl.formatMessage({ id: "grid.item.uninstalling" }) };
    }
    if (task === "download") {
      res = { status: intl.formatMessage({ id: "grid.item.downloading" }) };
    }
    if (task === "ask-before-install") {
      res = {
        status: intl.formatMessage({ id: "grid.item.finalize_installation" }),
      };
    }
    if (task === "download-queued") {
      res = { status: intl.formatMessage({ id: "grid.item.queued" }) };
    }

    return res;
  }
}

interface IProps extends IActionsInfo {
  /** whether or not to animate the main action's icon (to indicate something's going on) */
  animate: boolean;
  platform: ItchPlatform;
  platformCompatible: boolean;
  progress: number;
  cancellable: boolean;

  pressDownload: boolean;

  update: IGameUpdate;
  className?: string;
}

interface IDerivedProps {
  queueGame: typeof actions.queueGame;
  showGameUpdate: typeof actions.showGameUpdate;
  initiatePurchase: typeof actions.initiatePurchase;
  abortGameRequest: typeof actions.abortGameRequest;
  navigate: typeof actions.navigate;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(MainAction), {
  dispatch: dispatch => ({
    queueGame: dispatcher(dispatch, actions.queueGame),
    showGameUpdate: dispatcher(dispatch, actions.showGameUpdate),
    initiatePurchase: dispatcher(dispatch, actions.initiatePurchase),
    abortGameRequest: dispatcher(dispatch, actions.abortGameRequest),
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
