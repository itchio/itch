
import * as React from "react";
import * as classNames from "classnames";

import Icon from "./icon";
import {map} from "underscore";

import listensToClickOutside = require("react-onclickoutside");
import {connect} from "./connect";

import {ILocalizer} from "../localizer";
import {ILocalizedString} from "../types";
import {IAction, IDispatch} from "../constants/action-types";

export class Dropdown extends React.Component<IDropdownProps, IDropdownState> {
  constructor () {
    super();
    this.state = {open: false};
  }

  render () {
    const {t, dispatch, items, inner, className = "dropdown-container", updown = false} = this.props;

    const {open} = this.state;
    const containerClasses = classNames(className, {disabled: items.length === 0});
    const dropdownClasses = classNames("dropdown", {active: open, updown});

    const children = map(items, (item, index) => {
      const {label, icon, action, type} = item;
      const {onClick = () => dispatch(action)} = item;
      const itemClasses = classNames("dropdown-item", `type-${type}`);

      const key = (type === "separator") ? ("separator-" + index) : (label + "-" + icon);

      return <section className={itemClasses} key={key} onClick={() => { onClick(); this.close(); }}>
        <Icon icon={icon}/>
        {t.format(label)}
      </section>;
    });

    let innerClasses = "";
    if (updown !== open) { // boolean xor
      innerClasses += "flipped";
    }

    const innerC = <div className={innerClasses} onClick={this.toggle.bind(this)}>{inner}</div>;
    const childrenC = <div className={dropdownClasses}>
      {children}
    </div>;

    return <div style={{position: "relative"}} className={containerClasses}>
      <div className="dropdown-container">
      {updown
        ? [childrenC, innerC]
        : [innerC, childrenC]
      }
      </div>
    </div>;
  }

  toggle () {
    this.setState({open: !this.state.open});
  }

  close () {
    this.setState({open: false});
  }

  handleClickOutside () {
    this.close();
  }
}

interface IDropdownItem {
  label: ILocalizedString;
  action: IAction<any>;
  type: string;
  icon?: string;
  onClick?: () => void;
}

interface IDropdownProps {
  inner: React.ReactElement<any>;
  className?: string;
  items: IDropdownItem[];
  updown?: boolean;

  t: ILocalizer;
  dispatch: IDispatch;
}

interface IDropdownState {
  open: boolean;
}

const listening = listensToClickOutside(Dropdown);

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: IDispatch) => ({dispatch});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(listening);
