import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "../connect";

import LoadingCircle from "../basics/loading-circle";
import Icon from "../basics/icon";
import Button from "../basics/button";
import IconButton from "../basics/icon-button";

import {
  IGameStatus,
  OperationType,
  Access,
} from "../../helpers/get-game-status";
import format from "../format";
import actionForGame from "../../util/action-for-game";
import { ILocalizedString } from "../../types/index";
import * as classNames from "classnames";
import { Game } from "../../butlerd/messages";

class MainAction extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { wide } = this.props;
    const { cave, access, operation, compatible, update } = this.props.status;

    let iconComponent: JSX.Element;
    let icon: string;
    let label: ILocalizedString;
    let primary = false;

    if (operation) {
      const { type, progress } = operation;
      if (operation.paused) {
        iconComponent = <Icon icon="stopwatch" />;
      } else if (!operation.active) {
        iconComponent = <Icon icon="stopwatch" />;
      } else {
        iconComponent = (
          <LoadingCircle
            bare
            wide={wide}
            progress={progress > 0 ? progress : 0.1}
          />
        );
      }

      if (type === OperationType.Download) {
        if (operation.paused) {
          label = ["grid.item.downloads_paused"];
        } else if (operation.active) {
          label = ["grid.item.installing"];
        } else {
          label = ["grid.item.queued"];
        }
      } else if (type === OperationType.Task) {
        const { name, stage } = operation;
        if (name === "launch") {
          if (stage === "prepare") {
            label = ["grid.item.running.prepare"];
          } else if (stage === "clean") {
            label = ["grid.item.running.clean"];
          } else {
            label = ["grid.item.running"];
          }
        } else if (name === "uninstall") {
          label = ["grid.item.uninstalling"];
        } else {
          label = ["grid.item.installing"];
        }
      }
    } else if (cave) {
      if (update) {
        label = ["grid.item.update"];
        icon = "star";
      } else {
        const action = actionForGame(this.props.game, cave);
        label = [`grid.item.${action}`];

        if (action === "open") {
          icon = "folder-open";
        } else {
          icon = "play2";
        }
        primary = true;
      }
    } else {
      if (compatible) {
        if (access === Access.Demo || access === Access.Press) {
          label = ["grid.item.review"];
          icon = "install";
        } else if (
          access === Access.Pwyw ||
          access === Access.Free ||
          access === Access.Key ||
          access === Access.Edit
        ) {
          label = ["grid.item.install"];
          icon = "install";
        } else {
          label = ["grid.item.buy_now"];
          icon = "shopping_cart";
        }
      } else {
        label = ["grid.item.not_compatible"];
        icon = "neutral";
      }
    }

    if (!label) {
      return null;
    }

    const { iconOnly, className } = this.props;
    if (iconOnly) {
      if (!iconComponent) {
        if (icon) {
          iconComponent = <Icon icon={icon} />;
        }
      }
      return (
        <IconButton
          onClick={this.onClick}
          className={classNames(className, "main-action")}
          data-game-id={this.props.game.id}
          icon={iconComponent}
          hint={label}
          hintPosition="left"
        />
      );
    }

    return (
      <Button
        onClick={this.onClick}
        className={classNames(className, "main-action")}
        wide={wide}
        discreet
        iconComponent={iconComponent}
        label={format(label)}
        primary={primary}
        data-game-id={this.props.game.id}
      />
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    e.stopPropagation();

    const { game, status } = this.props;
    const { operation, update, cave, access } = status;

    if (e.shiftKey && e.ctrlKey) {
      if (cave) {
        this.props.viewCaveDetails({ caveId: cave.id });
      }
      return;
    }

    if (operation) {
      if (operation.type === OperationType.Download) {
        this.props.navigate({ url: "itch://downloads" });
      } else if (operation.type === OperationType.Task) {
        if (operation.name === "launch") {
          this.props.forceCloseGameRequest({ game });
        }
      }
    } else if (cave) {
      if (update) {
        this.props.showGameUpdate({ update });
      } else {
        this.props.queueGame({ game });
      }
    } else {
      if (access === Access.None) {
        this.props.initiatePurchase({ game });
      } else {
        this.props.queueGame({ game });
      }
    }
  };
}

interface IProps {
  game: Game;
  status: IGameStatus;

  wide?: boolean;
  className?: string;
  iconOnly?: boolean;
}

const actionCreators = actionCreatorsList(
  "queueGame",
  "showGameUpdate",
  "initiatePurchase",
  "forceCloseGameRequest",
  "navigate",
  "viewCaveDetails"
);

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(MainAction, { actionCreators });
