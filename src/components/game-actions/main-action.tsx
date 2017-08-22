import * as React from "react";
import { connect } from "../connect";

import { injectIntl, InjectedIntl } from "react-intl";

import LoadingCircle from "../basics/loading-circle";
import Button from "../basics/button";

import * as actions from "../../actions";

import { IAppState } from "../../types";
import { dispatcher } from "../../constants/action-types";
import getCommons, {
  ICommonsForGame,
  OperationType,
  Access,
} from "./get-commons";
import { IGame } from "../../db/models/game";
import format from "../format";

class MainAction extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { cave, access, operation, compatible } = this.props;

    let iconComponent: JSX.Element;
    let label: string | JSX.Element;
    let primary = false;

    if (cave) {
      label = format(["grid.item.launch"]);
      primary = true;
    } else if (operation) {
      const { type, progress } = operation;
      iconComponent = (
        <LoadingCircle progress={progress > 0 ? progress : 0.1} />
      );

      if (type === OperationType.Download) {
        label = format(["grid.item.downloading"]);
      } else if (type === OperationType.Task) {
        const { name } = operation;
        if (name === "install") {
          label = format(["grid.item.installing"]);
        }
        label = format(["grid.item.installing"]);
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
        className={className}
        wide={wide}
        discreet
        iconComponent={iconComponent}
        label={label}
        primary={primary}
      />
    );
  }
}

interface IProps {
  game: IGame;
  wide?: boolean;
}

interface IDerivedProps extends ICommonsForGame {
  className?: string;

  intl: InjectedIntl;

  queueGame: typeof actions.queueGame;
  showGameUpdate: typeof actions.showGameUpdate;
  initiatePurchase: typeof actions.initiatePurchase;
  abortGameRequest: typeof actions.abortGameRequest;
  navigate: typeof actions.navigate;
}

export default connect<IProps>(injectIntl(MainAction), {
  state: (rs: IAppState, props: IProps) => {
    return getCommons(rs, props.game);
  },
  dispatch: dispatch => ({
    queueGame: dispatcher(dispatch, actions.queueGame),
    showGameUpdate: dispatcher(dispatch, actions.showGameUpdate),
    initiatePurchase: dispatcher(dispatch, actions.initiatePurchase),
    abortGameRequest: dispatcher(dispatch, actions.abortGameRequest),
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
