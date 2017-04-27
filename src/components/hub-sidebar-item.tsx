
import * as React from "react";
import * as classNames from "classnames";

import {ILocalizedString, ITabData, IGameRecord} from "../types";
import {ILocalizer} from "../localizer";

import Ink = require("react-ink");

import LoadingCircle from "./loading-circle";
import Icon from "./icon";

import styled, * as styles from "./styles";

const ItemHeading = styled.div`
    ${styles.singleLine()};
    padding: .2em 0;
`;

const SidebarItem = styled.section`
  background: ${props => props.theme.sidebarBackground};
  font-size: 14px;
  border-radius: 0 4px 4px 0;
  word-break: break-word;

  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  margin: 2px 0;
  margin-right: 0;
  padding: 5px 8px 5px 10px;
  min-height: 30px;

  position: relative;

  &.fresh {
    animation: ${styles.animations.enterLeft} .3s ease-out;
  }

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
  ${styles.progress()}

  width: 60px;
  height: 4px;
  margin: 4px 0 2px 10px;

  &, .progress-inner {
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

export class HubSidebarItem extends React.Component<IHubSidebarItemProps, IHubSidebarItemState> {
  constructor () {
    super();
    this.state = {
      fresh: true,
    };
  }

  onMouseUp (e: React.MouseEvent<HTMLElement>) {
    if (e.button === 1) {
      // middle click
      const {onClose} = this.props;
      if (onClose) {
        onClose();
      }
    } else if (e.button === 0) {
      // left (normal) click
      const {onClick} = this.props;
      if (onClick) {
        onClick();
      }
    }
  }

  render () {
    const {t, count, sublabel, progress, id, path, label, active} = this.props;
    const {fresh} = this.state;
    const {onClose, onContextMenu} = this.props;

    const progressColor = "white";
    const progressStyle = {
      width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
      backgroundColor: progressColor,
    };

    return <SidebarItem className={classNames({active, fresh})}
        data-rh-at="bottom"
        data-rh={t.format(sublabel)}
        onMouseUp={(e) => this.onMouseUp(e)}
        onContextMenu={onContextMenu}
        data-path={path}
        data-id={id}>
      <Row>
        <Ink/>
        <IconContainer>
          {this.props.loading
            ? <LoadingCircle progress={0.3}/>
            : (this.props.iconImage
              ? <img className="icon-image" src={this.props.iconImage}/>
              : <Icon icon={this.props.icon || "tag"}/>)}
        </IconContainer>
        <ItemHeading>{t.format(label)}</ItemHeading>
        {count > 0
          ? <Bubble>{count}</Bubble>
          : null
        }
        <div className="filler"/>
        {progress > 0
        ? <ProgressOuter>
          <div className="progress-inner" style={progressStyle}/>
        </ProgressOuter>
        : null}
        {onClose
          ? <span className="close-icon icon icon-cross" onClick={(e) => {
            onClose();
            e.stopPropagation();
          }}>
            <Ink/>
          </span>
          : null
        }
      </Row>
    </SidebarItem>;
  }

  componentDidMount () {
    setTimeout(() => {
      this.setState({ fresh: false });
    }, 400);
  }
}

interface IHubSidebarItemProps {
  path: string;
  id: string;
  label: ILocalizedString;
  active: boolean;
  count?: number;
  sublabel?: ILocalizedString;
  progress?: number;
  gameOverride?: IGameRecord;

  icon?: string;
  iconImage?: string;

  loading: boolean;

  onClick?: () => void;
  onContextMenu: () => void;
  onClose?: () => void;
  data?: ITabData;

  t: ILocalizer;
}

interface IHubSidebarItemState {
  fresh: boolean;
}

export default HubSidebarItem;
