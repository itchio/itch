import * as React from "react";
import { connect } from "../connect";

import { injectIntl, InjectedIntl } from "react-intl";

import LoadingCircle from "../basics/loading-circle";
import Icon from "../basics/icon";
import Button from "../basics/button";
import IconButton from "../basics/icon-button";

import * as actions from "../../actions";

import { dispatcher } from "../../constants/action-types";
import {
  IGameStatus,
  OperationType,
  Access,
} from "../../helpers/get-game-status";
import { IGame } from "../../db/models/game";
import format, { formatString } from "../format";
import actionForGame from "../../util/action-for-game";
import { ILocalizedString } from "../../types/index";

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
          label = ["grid.item.downloading"];
        } else {
          label = ["grid.item.queued"];
        }
      } else if (type === OperationType.Task) {
        const { name } = operation;
        if (name === "launch") {
          label = ["grid.item.running"];
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
          icon = "play";
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

    const { iconOnly, className, intl } = this.props;
    if (iconOnly) {
      if (!iconComponent) {
        if (icon) {
          iconComponent = <Icon icon={icon} />;
        }
      }
      return (
        <IconButton
          onClick={this.onClick}
          className={className}
          icon={iconComponent}
          hint={label ? formatString(intl, label) : null}
          hintPosition="left"
        />
      );
    }

    return (
      <Button
        onClick={this.onClick}
        className={className}
        wide={wide}
        discreet
        iconComponent={iconComponent}
        label={format(label)}
        primary={primary}
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
        this.props.navigate({ tab: "downloads" });
      } else if (operation.type === OperationType.Task) {
        if (operation.name === "launch") {
          this.props.abortGameRequest({ game });
        }
      }
    } else if (cave) {
      if (update) {
        this.props.showGameUpdate({ caveId: cave.id, update });
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
  game: IGame;
  status: IGameStatus;

  wide?: boolean;
  className?: string;
  iconOnly?: boolean;
}

interface IDerivedProps {
  intl: InjectedIntl;

  queueGame: typeof actions.queueGame;
  showGameUpdate: typeof actions.showGameUpdate;
  initiatePurchase: typeof actions.initiatePurchase;
  abortGameRequest: typeof actions.abortGameRequest;
  navigate: typeof actions.navigate;
  viewCaveDetails: typeof actions.viewCaveDetails;
}

export default connect<IProps>(injectIntl(MainAction), {
  dispatch: dispatch => ({
    queueGame: dispatcher(dispatch, actions.queueGame),
    showGameUpdate: dispatcher(dispatch, actions.showGameUpdate),
    initiatePurchase: dispatcher(dispatch, actions.initiatePurchase),
    abortGameRequest: dispatcher(dispatch, actions.abortGameRequest),
    navigate: dispatcher(dispatch, actions.navigate),
    viewCaveDetails: dispatcher(dispatch, actions.viewCaveDetails),
  }),
});
