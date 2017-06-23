import Icon from "../basics/icon";
import Ink = require("react-ink");

import * as React from "react";
import styled, * as styles from "../styles";

import { connect, I18nProps } from "../connect";
import { ILocalizedString } from "../../types";

const DropdownItemDiv = styled.div`
  ${styles.inkContainer()};
  ${styles.accentTextShadow()};

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
    background-color: ${props => props.theme.lightAccent};
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
    background: ${props => props.theme.lightAccent};
  }
`;

export class DropdownItem extends React.PureComponent<
  IProps & I18nProps,
  void
> {
  render() {
    const { t, item } = this.props;
    const { label, icon, type, id } = item;

    const className = type ? `type-${type}` : "";

    return (
      <DropdownItemDiv className={className} onClick={this.onClick} id={id}>
        <Ink />
        <Icon icon={icon} />
        {t.format(label)}
      </DropdownItemDiv>
    );
  }

  onClick = () => {
    const { item } = this.props;
    if (item.onClick) {
      item.onClick();
      this.props.onClick();
    }
  };
}

interface IProps {
  item: IDropdownItem;
  onClick: () => void;
}

export interface IDropdownItem {
  type?: string;
  label?: ILocalizedString;
  icon?: string;
  id?: string;
  onClick?: () => void;
}

export default connect<IProps>(DropdownItem);
