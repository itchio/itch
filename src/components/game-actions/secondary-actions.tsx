
import * as React from "react";
import * as classNames from "classnames";

import {connect, I18nProps} from "../connect";
import Icon from "../basics/icon";
import Ink = require("react-ink");

import listSecondaryActions, {IActionOpts} from "./list-secondary-actions";
import {map} from "underscore";

import {IDispatch} from "../../constants/action-types";
import {IActionsInfo} from "./types";

class SecondaryActions extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {items, error} = listSecondaryActions(this.props);

    return <div className={classNames("cave-actions", {error})}>
      {map(items, this.action.bind(this))}
    </div>;
  }

  action (opts: IActionOpts) {
    const {t, dispatch} = this.props;
    const {action, label, icon, type = "action", classes = []} = opts;

    if (type === "info" || type === "separator" || type === "secondary") {
      return;
    }

    const key = "" + label;

    const actionClasses = classNames("secondary-action", classes);
    return <span
        key={key}
        className={actionClasses}
        onClick={() => dispatch(action)}
        data-rh-at="top"
        data-rh={t.format(label)}>
      <Ink/>
      <Icon icon={icon}/>
    </span>;
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
