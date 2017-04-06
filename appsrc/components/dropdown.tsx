
import * as React from "react";
import * as classNames from "classnames";

import listensToClickOutside = require("react-onclickoutside");
import {connect, I18nProps} from "./connect";

import Icon from "./icon";
import {map} from "underscore";

import {ILocalizedString} from "../types";

const noop = () => { /* muffin */ };

export class Dropdown extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {open: false};
  }

  render () {
    const {t, items, inner, className = "dropdown-container", updown = false} = this.props;

    const {open} = this.state;
    const containerClasses = classNames(className, {disabled: items.length === 0});
    const dropdownClasses = classNames("dropdown", {active: open, updown});

    const children = map(items, (item, index) => {
      const {label, icon, type, onClick = noop} = item;
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

export interface IDropdownItem {
  type?: string;
  label?: ILocalizedString;
  icon?: string;
  onClick?: () => void;
}

interface IProps {
  inner: React.ReactElement<any>;
  className?: string;
  items: IDropdownItem[];
  updown?: boolean;
}

interface IDerivedProps {}

interface IState {
  open: boolean;
}

export default connect<IProps>(listensToClickOutside(Dropdown));
