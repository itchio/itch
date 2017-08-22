import * as React from "react";
import { connect } from "../connect";

import { injectIntl, InjectedIntl } from "react-intl";

import LoadingCircle from "../basics/loading-circle";
import Button from "../basics/button";

import * as actions from "../../actions";

import { dispatcher } from "../../constants/action-types";
import {
  IGameStatus,
  OperationType,
  Access,
} from "../../helpers/get-game-status";
import { IGame } from "../../db/models/game";
import format from "../format";
import actionForGame from "../../util/action-for-game";

class MainAction extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { cave, access, operation, compatible, update } = this.props.status;

    let iconComponent: JSX.Element;
    let label: string | JSX.Element;
    let primary = false;

    if (operation) {
      const { type, progress } = operation;
      iconComponent = (
        <LoadingCircle progress={progress > 0 ? progress : 0.1} />
      );

      if (type === OperationType.Download) {
        label = format(["grid.item.downloading"]);
      } else if (type === OperationType.Task) {
        const { name } = operation;
        if (name === "launch") {
          label = format(["grid.item.running"]);
          iconComponent = null;
        } else {
          label = format(["grid.item.installing"]);
        }
      }
    } else if (cave) {
      if (update) {
        label = format(["grid.item.update"]);
      } else {
        label = format([`grid.item.${actionForGame(this.props.game, cave)}`]);
        primary = true;
      }
    } else {
      if (compatible) {
        if (access === Access.Demo || access === Access.Press) {
          label = format(["grid.item.review"]);
        } else if (
          access === Access.Pwyw ||
          access === Access.Free ||
          access === Access.Key ||
          access === Access.Edit
        ) {
          label = format(["grid.item.install"]);
        } else {
          label = format(["grid.item.buy_now"]);
        }
      } else {
        label = format(["grid.item.not_compatible"]);
      }
    }

    if (!label) {
      return <div />;
    }

    const { className, wide } = this.props;
    return (
      <Button
        onClick={this.onClick}
        className={className}
        wide={wide}
        discreet
        iconComponent={iconComponent}
        label={label}
        primary={primary}
      />
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    e.stopPropagation();

    const { game, status } = this.props;
    const { operation, update, cave } = status;

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
    } else if (cave && update) {
      this.props.showGameUpdate({ caveId: cave.id, update });
    } else {
      this.props.queueGame({ game });
    }
  };
}

interface IProps {
  game: IGame;
  status: IGameStatus;

  wide?: boolean;
}

interface IDerivedProps {
  className?: string;

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
