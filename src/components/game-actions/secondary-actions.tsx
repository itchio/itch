
import * as React from "react";
import * as classNames from "classnames";

import {connect, I18nProps} from "../connect";
import IconButton from "../basics/icon-button";

import listSecondaryActions, {IActionOpts} from "./list-secondary-actions";
import {map} from "underscore";

import {IDispatch} from "../../constants/action-types";
import {IActionsInfo} from "./types";

import styled from "../styles";

const SecondaryActionsDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

class SecondaryActions extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {items, error} = listSecondaryActions(this.props);

    return <SecondaryActionsDiv className={classNames("cave-actions", {error})}>
      {map(items, this.action)}
    </SecondaryActionsDiv>;
  }

  action = (opts: IActionOpts) => {
    const {t, dispatch} = this.props;
    const {action, label, icon, type = "action", classes = []} = opts;

    if (type === "info" || type === "separator" || type === "secondary") {
      return;
    }

    const key = "" + label;

    const actionClasses = classNames("secondary-action", classes);
    return <IconButton
      icon={icon}
      key={key}
      className={actionClasses}
      onClick={() => dispatch(action)}
      hint={t.format(label)}
    />;
  }
}

interface IProps extends IActionsInfo {
}

interface IDerivedProps {
  dispatch: IDispatch;
}

export default connect<IProps>(SecondaryActions, {
  dispatch: (dispatch) => ({ dispatch }),
});
