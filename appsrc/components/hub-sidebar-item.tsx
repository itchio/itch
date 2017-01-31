
import * as React from "react";
import * as classNames from "classnames";

import {ILocalizedString, ITabData, IGameRecord} from "../types";
import {ILocalizer} from "../localizer";

import Ink = require("react-ink");

import LoadingCircle from "./loading-circle";
import Icon from "./icon";

export class HubSidebarItem extends React.Component<IHubSidebarItemProps, IHubSidebarItemState> {
  constructor () {
    super();
    this.state = {
      fresh: true,
    };
    this.onClick = this.onClick.bind(this);
  }

  onClick (e: React.MouseEvent<HTMLElement>) {
    const nativeEvent = e.nativeEvent as MouseEvent;
    if (nativeEvent.which === 2) {
      // middle click
      const {onClose} = this.props;
      if (onClose) {
        onClose();
      }
    } else {
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

    const classes = classNames("hub-sidebar-item", {active, fresh});

    const progressColor = "white";
    const progressStyle = {
      width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
      backgroundColor: progressColor,
    };

    return <section className={classes}
        data-rh-at="bottom"
        data-rh={t.format(sublabel)}
        onClick={this.onClick}
        onContextMenu={onContextMenu}
        data-path={path}
        data-id={id}>
      <div className="row">
        <Ink/>
        <div className="icon-container">
          {this.props.loading
            ? <LoadingCircle progress={0.3}/>
            : (this.props.iconImage
              ? <img className="icon-image" src={this.props.iconImage}/>
              : <Icon icon={this.props.icon || "tag"}/>)}
        </div>
        <span className="label">{t.format(label)}</span>
        {count > 0
          ? <span className="bubble">{count}</span>
          : null
        }
        <div className="filler"/>
        {progress > 0
        ? <div className="progress-outer">
          <div className="progress-inner" style={progressStyle}/>
        </div>
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
      </div>
    </section>;
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
