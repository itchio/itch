
import * as React from "react";
import * as classNames from "classnames";
import {map} from "underscore";

import listensToClickOutside = require("react-onclickoutside");
import {connect, I18nProps} from "../connect";

import DropdownItem, {IDropdownItem} from "./dropdown-item";

import styled, * as styles from "../styles";

const DropdownContainer = styled.div`
  position: relative;

  &.disabled {
    opacity: 0;
    pointer-events: none;
  }
`;

const DropdownInnerContainer = styled.div`
  &.flipped .flipper {
    transform: rotateZ(180deg);
  }
`;

const DropdownDiv = styled.div`
  background-color: ${props => props.theme.accent};
  border: 1px solid ${props => props.theme.lightAccent};
  box-shadow: 0 0 2px ${props => props.theme.accent};
  position: absolute;
  top: 0;
  left: 8px;
  right: 0px;
  visibility: hidden;

  &.updown {
    top: initial;
    bottom: 100%;
  }

  &.active {
    visibility: visible;
    animation: ${styles.animations.enterBottom} ease-in 0.2s;
  }
`;

export class Dropdown extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {open: false};
  }

  render () {
    const {items, inner, className, updown = false} = this.props;

    const {open} = this.state;
    const containerClasses = classNames(className, {disabled: items.length === 0});
    const dropdownClasses = classNames({active: open, updown});

    const children = map(
      items,
      (item, i) => <DropdownItem key={i} item={item} onClick={this.close}/>,
    );

    let innerClasses = "";
    if (updown !== open) { // boolean xor
      innerClasses += "flipped";
    }

    const innerC = <DropdownInnerContainer key="inner"
      className={innerClasses}
      onClick={this.toggle}>
        {inner}
    </DropdownInnerContainer>;

    const childrenC = <DropdownDiv key="children" className={dropdownClasses}>
      {children}
    </DropdownDiv>;

    return <DropdownContainer style={{position: "relative"}} className={containerClasses}>
      {updown
        ? [childrenC, innerC]
        : [innerC, childrenC]
      }
    </DropdownContainer>;
  }

  toggle = () => {
    this.setState({open: !this.state.open});
  }

  close () {
    this.setState({open: false});
  }

  handleClickOutside () {
    this.close();
  }
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
