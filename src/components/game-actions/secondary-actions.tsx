import * as React from "react";
import * as classNames from "classnames";

import { connect } from "../connect";
import IconButton from "../basics/icon-button";

import listSecondaryActions, { IActionOpts } from "./list-secondary-actions";
import { map } from "underscore";

import { IActionsInfo } from "./types";

import styled, * as styles from "../styles";

import { IDispatch } from "../../types/index";

const SecondaryActionsDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  animation: ${styles.animations.fadeIn} 0.1s ease-in;
`;

class SecondaryActions extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { items, error } = listSecondaryActions(this.props);

    return (
      <SecondaryActionsDiv className={classNames("cave-actions", { error })}>
        {map(items, this.action)}
      </SecondaryActionsDiv>
    );
  }

  action = (opts: IActionOpts) => {
    const { dispatch } = this.props;
    const { action, label, icon, type = "action", classes = [] } = opts;

    if (type === "info" || type === "separator" || type === "secondary") {
      return;
    }

    const key = "" + label;

    const actionClasses = classNames("secondary-action", classes);
    return (
      <IconButton
        icon={icon}
        key={key}
        className={actionClasses}
        onClick={() => dispatch(action)}
        hint={label}
      />
    );
  };
}

interface IProps extends IActionsInfo {}

interface IDerivedProps {
  dispatch: IDispatch;
}

export default connect<IProps>(SecondaryActions, {
  dispatch: dispatch => ({ dispatch }),
});
