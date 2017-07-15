
import * as React from "react";
import * as classNames from "classnames";

import {connect} from "../connect";
import Icon from "../icon";

import listSecondaryActions, {IActionOpts} from "./list-secondary-actions";
import {map} from "underscore";

import {ILocalizer} from "../../localizer";
import {IDispatch} from "../../constants/action-types";
import {IActionsInfo} from "./types";

import Ink = require("react-ink");

class SecondaryActions extends React.Component<ISecondaryActionsProps> {
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

interface ISecondaryActionsProps extends IActionsInfo {
  t: ILocalizer;
  dispatch: IDispatch;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: IDispatch) => ({dispatch});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SecondaryActions);
