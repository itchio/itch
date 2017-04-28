
import * as React from "react";
import * as classNames from "classnames";

import listensToClickOutside = require("react-onclickoutside");
import {connect, I18nProps} from "./connect";

import Icon from "./icon";
import {map} from "underscore";

import {ILocalizedString} from "../types";

import styled from "./styles";
import {lighten} from "polished";

const DropdownContainer = styled.div`
  position: relative;

  &.disabled {
    opacity: 0;
    pointer-events: none;
  }
`;

const DropdownInnerContainer = styled.div`
  &.flipped .flipper {
    transform: rotateX(180deg);
  }
`;

const DropdownDiv = styled.div`
  background-color: ${props => lighten(.05, props.theme.sidebarBackground)};
  border: 1px solid ${props => props.theme.dropdownBackground};
  position: absolute;
  top: 0;
  left: 0;
  right: 1px;
  visibility: hidden;

  &.updown {
    top: initial;
    bottom: 100%;
  }

  &.active {
    visibility: visible;
  }
`;

const DropdownItem = styled.div`
  border-radius: 1px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 10px 8px 10px 3px;
  line-height: 1.4;
  font-size: 14px;

  &:hover {
    cursor: pointer;
    background-color: ${props => props.theme.sidebarBackground};
  }

  .icon {
    margin: 0 8px;
  }

  &.type-info {
    color: #6D6D6D;
  }

  &.type-separator {
    height: 1px;
    padding: 0;
    background: #444242;
  }
`;

const noop = () => { /* muffin */ };

export class Dropdown extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {open: false};
  }

  render () {
    const {t, items, inner, className, updown = false} = this.props;

    const {open} = this.state;
    const containerClasses = classNames(className, {disabled: items.length === 0});
    const dropdownClasses = classNames({active: open, updown});

    const children = map(items, (item, index) => {
      const {label, icon, type, onClick = noop} = item;
      const itemClasses = classNames(type && `type-${type}`);

      const key = (type === "separator") ? ("separator-" + index) : (label + "-" + icon);

      return <DropdownItem className={itemClasses} key={key} onClick={() => { onClick(); this.close(); }}>
        <Icon icon={icon}/>
        {t.format(label)}
      </DropdownItem>;
    });

    let innerClasses = "";
    if (updown !== open) { // boolean xor
      innerClasses += "flipped";
    }

    const toggle = this.toggle.bind(this);
    const innerC = <DropdownInnerContainer key="inner"
      className={innerClasses}
      onClick={toggle}>
        {inner}
    </DropdownInnerContainer>;
    const childrenC = <DropdownDiv key="children" className={dropdownClasses}>
      {open ? children : null}
    </DropdownDiv>;

    return <DropdownContainer style={{position: "relative"}} className={containerClasses}>
      {updown
        ? [childrenC, innerC]
        : [innerC, childrenC]
      }
    </DropdownContainer>;
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
