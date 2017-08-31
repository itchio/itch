import * as React from "react";
import * as classNames from "classnames";

import format from "../format";

import { ILocalizedString, ITabData } from "../../types";

import Filler from "../basics/filler";
import LoadingCircle from "../basics/loading-circle";
import Icon from "../basics/icon";
import IconButton from "../basics/icon-button";

import styled, * as styles from "../styles";
import { darken } from "polished";

const UnshrinkableIconButton = styled(IconButton)`
  flex-shrink: 0;
`;

const ItemHeading = styled.div`
  ${styles.singleLine()};
  padding: .2em 0;
`;

export const ItemDiv = styled.section`
  background: ${props => props.theme.sidebarBackground};
  font-size: 14px;
  border-radius: 0 4px 4px 0;
  word-break: break-word;

  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  margin: 2px 0;
  margin-right: 0;
  padding-left: 8px;
  height: 32px;
  justify-content: center;

  position: relative;

  &.active {
    .icon-cross {
      opacity: 1;
      color: ${props => props.theme.secondaryText}

      &:hover {
        color: ${props => props.theme.secondaryTextHover}
      }
    }
    
    background: ${props => props.theme.sidebarEntryFocusedBackground}
  }

  &:hover {
    cursor: pointer;
    background: ${props =>
      darken(0.05, props.theme.sidebarEntryFocusedBackground)};
    color: ${props => props.theme.baseText};

    .icon-cross {
      opacity: 1;
    }
  }
`;

const Row = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
`;

const IconContainer = styled.div`
  width: 18px;
  height: 16px;
  margin-right: 4px;
  text-align: center;

  img {
    width: 14px;
    height: 14px;
    margin-right: 2px;
    border-radius: 2px;
  }
`;

const ProgressOuter = styled.div`
  ${styles.progress()} width: 60px;
  height: 4px;
  margin: 4px 0 2px 10px;

  &,
  .progress-inner {
    border-radius: 4px;
  }

  .progress-inner {
    background-color: white;
  }
`;

const Bubble = styled.span`
  font-size: 11px;
  background: white;
  border-radius: 2px;
  color: ${props => props.theme.sidebarBackground};
  font-weight: bold;
  padding: 1px 6px;
  margin-left: 8px;
  white-space: nowrap;
`;

class Item extends React.PureComponent<IProps, IState> {
  freshTimeout: NodeJS.Timer;

  constructor() {
    super();
    this.state = {
      fresh: true,
    };
  }

  onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.shiftKey && e.ctrlKey) {
      const { onExplore, tab } = this.props;
      if (onExplore) {
        onExplore(tab);
        return;
      }
    }

    // left (normal) click
    const { onClick } = this.props;
    if (onClick) {
      onClick();
    }
  };

  onMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    if (e.button === 1) {
      // middle click
      const { onClose } = this.props;
      if (onClose) {
        onClose();
      }
    }
  };

  onCloseClick = (e: React.MouseEvent<any>) => {
    e.stopPropagation();

    const { onClose } = this.props;
    if (onClose) {
      onClose();
    }
  };

  render() {
    const { count, sublabel, progress, tab, path, label, active } = this.props;
    const { fresh } = this.state;
    const { onClose, onContextMenu } = this.props;

    const progressColor = "white";
    const progressStyle = {
      width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
      backgroundColor: progressColor,
    };

    return (
      <ItemDiv
        className={classNames({ active, fresh })}
        data-rh-at="right"
        data-rh={format(sublabel)}
        onClick={this.onClick}
        onMouseUp={this.onMouseUp}
        onContextMenu={onContextMenu}
        data-path={path}
        data-id={tab}
      >
        <Row>
          <IconContainer>
            {this.props.loading
              ? <LoadingCircle progress={0.3} />
              : this.props.iconImage
                ? <img className="icon-image" src={this.props.iconImage} />
                : <Icon icon={this.props.icon || "tag"} />}
          </IconContainer>
          <ItemHeading>
            {format(label)}
          </ItemHeading>
          {count > 0
            ? <Bubble>
                {count}
              </Bubble>
            : null}
          <Filler />
          {progress > 0
            ? <ProgressOuter>
                <div className="progress-inner" style={progressStyle} />
              </ProgressOuter>
            : null}
          {onClose
            ? <UnshrinkableIconButton
                icon="cross"
                onClick={this.onCloseClick}
              />
            : null}
        </Row>
      </ItemDiv>
    );
  }

  componentDidMount() {
    this.freshTimeout = setTimeout(() => {
      this.setState({ fresh: false });
    }, 400);
  }

  componentWillUnmount() {
    clearTimeout(this.freshTimeout);
  }
}

interface IProps {
  path: string;
  tab: string;
  label: ILocalizedString;
  active: boolean;
  count?: number;
  sublabel?: ILocalizedString;
  progress?: number;

  icon?: string;
  iconImage?: string;

  loading: boolean;

  onClick?: () => void;
  onContextMenu: (ev: React.MouseEvent<any>) => void;
  onClose?: () => void;
  onExplore?: (tabId: string) => void;
  data?: ITabData;
}

interface IState {
  fresh: boolean;
}

export default Item;
