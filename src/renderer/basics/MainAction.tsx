import classNames from "classnames";
import { Game } from "common/butlerd/messages";
import {
  Access,
  GameStatus,
  OperationType,
} from "common/helpers/get-game-status";
import { LocalizedString } from "common/types";
import { actionForGame } from "common/util/action-for-game";
import React from "react";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import { T } from "renderer/t";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import LoadingCircle from "renderer/basics/LoadingCircle";
import styled from "renderer/styles";

const NotCompatibleSpan = styled.span`
  flex-shrink: 0;
`;

class MainAction extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { wide } = this.props;
    const { cave, access, operation, compatible, update } = this.props.status;

    let iconComponent: JSX.Element;
    let icon: string;
    let label: LocalizedString;
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
        return <NotCompatibleSpan>{T(label)}</NotCompatibleSpan>;
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
        label={T(label)}
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
        this.props.navigate({ window: "root", url: "itch://downloads" });
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

interface Props {
  game: Game;
  status: GameStatus;

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

type DerivedProps = Dispatchers<typeof actionCreators>;

export default connect<Props>(
  MainAction,
  { actionCreators }
);
