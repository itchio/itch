
import * as React from "react";
import * as classNames from "classnames";

import colors from "../constants/colors";
import bob, {IRGBColor} from "../renderer-util/bob";

import {ILocalizedString, ITabData, IGameRecord, IGameRecordSet} from "../types";
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
    const {t, count, sublabel, progress, id, path, label, active, halloween} = this.props;
    const {onClose, onContextMenu} = this.props;

    const classes = classNames("hub-sidebar-item", {active, fresh: this.state.fresh});
    const style: React.CSSProperties = {
      position: "relative",
    };
    const {dominantColor} = this.state;

    if (active) {
      if (halloween) {
        style.borderColor = colors.spooky;
      } else if (dominantColor) {
        style.borderColor = bob.toCSS(dominantColor);
      }
    }

    const progressColor = dominantColor ? bob.toCSS(dominantColor) : "white";
    const progressStyle = {
      width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
      backgroundColor: progressColor,
    };

    return <section key={id} style={style} className={classes}
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
          }}/>
          : null
        }
      </div>
    </section>;
  }

  componentWillReceiveProps () {
    this.updateColor();
  }

  componentDidMount () {
    this.updateColor();

    setTimeout(() => {
      this.setState({fresh: false});
    }, 400);
  }

  updateColor () {
    let game = this.props.gameOverride;
    if (!game) {
      const games = (this.props.data || {}).games as IGameRecordSet;
      if (games) {
        game = games[Object.keys(games)[0]];
      }
    }

    if (game) {
      bob.extractPalette(game.coverUrl, (palette) => {
        this.setState({dominantColor: bob.pick(palette)});
      });
    }
  }
}

interface IHubSidebarItemProps {
  index?: number;
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
  halloween: boolean;

  onClick?: () => void;
  onContextMenu: () => void;
  onClose?: () => void;
  data?: ITabData;

  t: ILocalizer;
}

interface IHubSidebarItemState {
  fresh?: boolean;
  dominantColor?: IRGBColor;
}

export default HubSidebarItem;
