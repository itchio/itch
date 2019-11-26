import classNames from "classnames";
import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import {
  Access,
  GameStatus,
  OperationType,
} from "common/helpers/get-game-status";
import { Dispatch, LocalizedString } from "common/types";
import { actionForGame } from "common/util/action-for-game";
import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { T } from "renderer/t";
import { hook } from "renderer/hocs/hook";
import { isSecretClick } from "common/helpers/secret-click";

class MainAction extends React.PureComponent<Props> {
  render() {
    const { wide } = this.props;
    const { cave, access, operation, update } = this.props.status;
    let translucent = false;
    let iconComponent: JSX.Element;
    let icon: string;
    let label: LocalizedString;
    let primary = false;

    if (operation) {
      const { type, progress } = operation;
      translucent = true;
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
        } else if (name === "install-queue") {
          label = ["grid.item.queueing"];
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
        translucent={translucent}
        iconComponent={iconComponent}
        label={T(label)}
        primary={primary}
        data-game-id={this.props.game.id}
      />
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    e.stopPropagation();

    const { dispatch, game, status } = this.props;
    const { operation, update, cave, access } = status;

    if (isSecretClick(e)) {
      if (cave) {
        dispatch(actions.viewCaveDetails({ caveId: cave.id }));
      }
      return;
    }

    if (operation) {
      if (operation.type === OperationType.Download) {
        dispatch(actions.navigate({ wind: "root", url: "itch://downloads" }));
      } else if (operation.type === OperationType.Task) {
        if (operation.name === "launch") {
          dispatch(actions.forceCloseGameRequest({ game }));
        }
      }
    } else if (cave) {
      if (update) {
        dispatch(actions.showGameUpdate({ update }));
      } else {
        dispatch(actions.queueGame({ game }));
      }
    } else {
      if (access === Access.None) {
        dispatch(actions.initiatePurchase({ game }));
      } else {
        dispatch(actions.queueGame({ game }));
      }
    }
  };
}

interface Props {
  game: Game;
  caveId?: string;
  status: GameStatus;

  wide?: boolean;
  className?: string;
  iconOnly?: boolean;

  dispatch: Dispatch;
}

export default hook()(MainAction);
