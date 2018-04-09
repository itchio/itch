import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";
import {
  IRootState,
  IUIContextMenuState,
  IMenuItem,
  IMenuTemplate,
  IDispatch,
} from "common/types";

import styled from "./styles";

import {
  ContextMenu,
  MenuItem,
  ContextMenuTrigger,
  SubMenu,
} from "react-contextmenu";
import { createSelector } from "reselect";
import { T } from "renderer/t";

import { lighten } from "polished";

const menuId = "itch_context_menu";

const noop = () => null;

interface ITriggerEvent {
  preventDefault: () => void;
  stopPropagation: () => void;
  clientX: number;
  clientY: number;
}

// avert your gaze
// avert it I say!
interface IMenuComponent {
  state: {
    isVisible?: boolean;
  };
}

interface ITriggerComponent {
  handleContextClick: (ev: ITriggerEvent) => void;
}

const ContextMenuHandlerDiv = styled.div`
  .react-contextmenu {
    min-width: 160px;
    padding: 5px 0;
    margin: 2px 0 0;
    font-size: 14px;
    text-align: left;
    background-color: ${props => lighten(0.05, props.theme.sidebarBackground)};
    background-clip: padding-box;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    outline: none;
    opacity: 0;
    pointer-events: none;
    transition: opacity 250ms ease !important;
    z-index: 9000;
  }

  .react-contextmenu.react-contextmenu--visible {
    opacity: 1;
    pointer-events: auto;
  }

  .react-contextmenu-item {
    padding: 4px 28px 4px 32px;
    font-weight: 400;
    line-height: 1.5;
    color: ${props => props.theme.baseText};
    text-align: inherit;
    white-space: nowrap;
    background: 0 0;
    border: 0;
    cursor: pointer;

    &:focus {
      outline: 0;
    }
  }

  .react-contextmenu-item .accelerator {
    color: ${props => lighten(0.4, props.theme.baseColors.codGray)};
    float: right;
    padding-left: 8px;
  }

  .react-contextmenu-item.react-contextmenu-item--active,
  .react-contextmenu-item.react-contextmenu-item--selected {
    cursor: pointer;
    background-color: ${props => lighten(0.1, props.theme.sidebarBackground)};
  }

  .react-contextmenu-item.react-contextmenu-item--disabled,
  .react-contextmenu-item.react-contextmenu-item--disabled:hover {
    color: ${props => props.theme.baseColors.silverChalice};
    background-color: transparent;
    border-color: rgba(0, 0, 0, 0.15);
  }

  .react-contextmenu-item--divider {
    margin-bottom: 3px;
    padding: 2px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    cursor: inherit;
  }

  .react-contextmenu-item.react-contextmenu-submenu {
    padding: 0;
  }

  .react-contextmenu-item.react-contextmenu-submenu > .react-contextmenu-item {
    padding-right: 30px;
  }

  .react-contextmenu-item.react-contextmenu-submenu
    > .react-contextmenu-item:after {
    content: "▶";
    display: inline-block;
    position: absolute;
    right: 7px;
  }
`;

class ContextMenuHandler extends React.PureComponent<IDerivedProps> {
  trigger?: ITriggerComponent;
  menu?: IMenuComponent;

  render() {
    return (
      <ContextMenuHandlerDiv>
        <ContextMenuTrigger id={menuId} ref={this.gotTrigger}>
          {" "}
        </ContextMenuTrigger>

        <ContextMenu
          id={menuId}
          ref={this.gotMenu}
          onShow={this.onShow}
          onHide={this.onHide}
        >
          {this.renderItems(this.props.data.template)}
        </ContextMenu>
      </ContextMenuHandlerDiv>
    );
  }

  formatAccelerator(accelerator: Electron.Accelerator): JSX.Element {
    if (!accelerator) {
      return null;
    }

    const { macos } = this.props;
    const tokens = accelerator.split("+").map(t => {
      if (t === "CmdOrCtrl") {
        return macos ? "⌘" : "Ctrl";
      } else if (macos) {
        if (t === "Cmd") {
          return "⌘";
        } else if (t === "Shift") {
          return "⇧";
        } else if (t === "Ctrl") {
          return "⌃";
        } else if (t === "Alt") {
          return "⌥";
        }
      }
      return t;
    });

    const output = tokens.join(macos ? "" : "+");

    return <span className="accelerator">{output}</span>;
  }

  renderItems(template: IMenuTemplate): JSX.Element[] {
    return template.map((item, index) => {
      const key = String(index);
      const label = this.formatLabel(item);
      const divider = item.type === "separator";
      const { enabled = true, id } = item;
      const disabled = !enabled;
      const accelerator = this.formatAccelerator(item.accelerator);

      let onClick: (ev: React.MouseEvent<any>) => void = null;
      if (item.action) {
        onClick = () => {
          this.props.dispatch(item.action);
        };
      }

      if (item.submenu) {
        return (
          <SubMenu key={key} title={label}>
            {this.renderItems(item.submenu)}
          </SubMenu>
        );
      } else {
        return (
          <MenuItem
            key={key}
            divider={divider}
            disabled={disabled}
            onClick={onClick}
          >
            <span id={id}>
              {label}
              {accelerator}
            </span>
          </MenuItem>
        );
      }
    });
  }

  formatLabel(item: IMenuItem): JSX.Element {
    if (item.localizedLabel) {
      return T(item.localizedLabel) as JSX.Element;
    } else if (item.label) {
      return <span>{item.label}</span>;
    } else {
      return null;
    }
  }

  componentWillReceiveProps(nextProps: IDerivedProps) {
    this.maybeOpen(nextProps);
  }

  maybeOpen(props: IDerivedProps) {
    if (!(this.trigger && this.menu)) {
      return;
    }

    if (props.open && !this.menu.state.isVisible) {
      this.trigger.handleContextClick({
        clientX: props.data.clientX,
        clientY: props.data.clientY,
        preventDefault: noop,
        stopPropagation: noop,
      });
      this.setState({ open: true });
    }
  }

  onHide = () => {
    this.setState({ open: false });
    this.props.closeContextMenu({});
  };

  onShow = () => {
    this.setState({ open: true });
  };

  gotTrigger = trigger => {
    this.trigger = trigger;
    this.maybeOpen(this.props);
  };

  gotMenu = menu => {
    this.menu = menu;
    this.maybeOpen(this.props);
  };
}

const actionCreators = actionCreatorsList("closeContextMenu");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  open: boolean;
  data: IUIContextMenuState["data"];
  macos: boolean;

  dispatch: IDispatch;
};

export default connect<{}>(ContextMenuHandler, {
  state: createSelector(
    (rs: IRootState) => rs.ui.contextMenu.open,
    (rs: IRootState) => rs.ui.contextMenu.data,
    (rs: IRootState) => rs.system.macos,
    (open, data, macos) => ({ open, data, macos })
  ),
  actionCreators,
  dispatch: dispatch => ({ dispatch }),
});
