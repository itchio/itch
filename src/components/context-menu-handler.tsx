import * as React from "react";
import { connect } from "./connect";
import {
  IRootState,
  IUIContextMenuState,
  IMenuItem,
  IMenuTemplate,
} from "../types/index";

import {
  ContextMenu,
  MenuItem,
  ContextMenuTrigger,
  SubMenu,
} from "react-contextmenu";
import { createSelector } from "reselect";
import format from "./format";

import * as actions from "../actions";
import { dispatcher } from "../constants/action-types";
import { Action } from "redux-actions";

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

class ContextMenuHandler extends React.PureComponent<IDerivedProps> {
  trigger?: ITriggerComponent;
  menu?: IMenuComponent;

  render() {
    return (
      <div>
        <ContextMenuTrigger id={menuId} ref={this.gotTrigger}>
          {null}
        </ContextMenuTrigger>

        <ContextMenu
          id={menuId}
          ref={this.gotMenu}
          onShow={this.onShow}
          onHide={this.onHide}
        >
          {this.renderItems(this.props.data.template)}
        </ContextMenu>
      </div>
    );
  }

  renderItems(template: IMenuTemplate): JSX.Element[] {
    return template.map((item, index) => {
      const key = String(index);
      const label = this.formatLabel(item);
      const divider = item.type === "separator";
      const { enabled = true, id } = item;
      const disabled = !enabled;
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
            {id ? <span id={id}>{label}</span> : label}
          </MenuItem>
        );
      }
    });
  }

  formatLabel(item: IMenuItem): JSX.Element {
    if (item.localizedLabel) {
      return format(item.localizedLabel) as JSX.Element;
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
        clientX: props.data.x,
        clientY: props.data.y,
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

interface IDerivedProps {
  open: boolean;
  data: IUIContextMenuState["data"];

  closeContextMenu: typeof actions.closeContextMenu;
  dispatch: (action: Action<any>) => void;
}

export default connect<{}>(ContextMenuHandler, {
  state: createSelector(
    (rs: IRootState) => rs.ui.contextMenu.open,
    (rs: IRootState) => rs.ui.contextMenu.data,
    (open, data) => ({ open, data })
  ),
  dispatch: dispatch => ({
    closeContextMenu: dispatcher(dispatch, actions.closeContextMenu),
    dispatch,
  }),
});
