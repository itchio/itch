import * as React from "react";
import { SortableElement } from "react-sortable-hoc";
import { createStructuredSelector } from "reselect";

import Item from "./item";

import { pathToIcon, makeLabel } from "../../util/navigation";
import { connect } from "../connect";

import * as actions from "../../actions";
import { dispatcher } from "../../constants/action-types";

import { size } from "underscore";
import {
  getFinishedDownloads,
  getActiveDownload,
} from "../../reactors/downloads/getters";

import { IGame } from "../../db/models/game";
import {
  IAppState,
  ITabData,
  ILocalizedString,
  IDownloadsState,
} from "../../types";

import { injectIntl, InjectedIntl } from "react-intl";
import { formatDurationAsMessage } from "../../format/datetime";

interface ISortableHubSidebarItemProps {
  props: any & {
    id: string;
  };
}

const emptyObj = {};

const SortableItem = SortableElement((props: ISortableHubSidebarItemProps) => {
  return <Item {...props.props} />;
});

class Tab extends React.PureComponent<IProps & IDerivedProps> {
  onClick = () => {
    const { id, navigate } = this.props;
    navigate({ id });
  };

  onClose = () => {
    const { id, closeTab } = this.props;
    closeTab({ id });
  };

  onContextMenu = () => {
    const { id, openTabContextMenu } = this.props;
    openTabContextMenu({ id });
  };

  render() {
    const { id, index, sortable, data, active, loading } = this.props;

    const path = data.path || id;
    let iconImage = data.iconImage;
    if (/^url/.test(path)) {
      iconImage = data.webFavicon;
    }

    const label = makeLabel(id, data);
    const icon = pathToIcon(path);
    let count = 0;
    let progress = 0;
    let sublabel: ILocalizedString = null;

    if (id === "downloads") {
      const { downloads } = this.props;
      count = size(getFinishedDownloads(downloads));
      const activeDownload = getActiveDownload(downloads);
      if (activeDownload) {
        progress = activeDownload.progress;
        if (downloads.paused) {
          sublabel = ["grid.item.downloads_paused"];
        } else {
          const title = activeDownload.game.title;
          const { intl } = this.props;
          const humanDuration = intl.formatMessage(
            formatDurationAsMessage(activeDownload.eta),
          );
          sublabel = `${title} — ${humanDuration}`;
        }
      }
    }

    let gameOverride: IGame = null;
    let { onClick, onClose, onContextMenu } = this;
    if (!sortable) {
      onClose = null;
    }

    const props = {
      id,
      path,
      label,
      icon,
      iconImage,
      active,
      onClick,
      count,
      progress,
      onClose,
      onContextMenu,
      data,
      sublabel,
      gameOverride,
      loading,
    };

    if (sortable) {
      return <SortableItem key={id} index={index} props={props} />;
    } else {
      return <Item key={id} {...props} />;
    }
  }
}

interface IProps {
  id: string;
  index?: number;
  active: boolean;
  sortable?: boolean;
}

interface IDerivedProps {
  data: ITabData;
  loading: boolean;
  downloads?: IDownloadsState;

  navigate: typeof actions.navigate;
  closeTab: typeof actions.closeTab;
  openTabContextMenu: typeof actions.openTabContextMenu;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(Tab), {
  state: (initialState, initialProps) => {
    let { id } = initialProps;

    return createStructuredSelector({
      data: (state: IAppState) => state.session.tabData[id] || emptyObj,
      loading: (state: IAppState) => !!state.session.navigation.loadingTabs[id],
      downloads: (state: IAppState) => id === "downloads" && state.downloads,
    });
  },
  dispatch: dispatch => ({
    navigate: dispatcher(dispatch, actions.navigate),
    closeTab: dispatcher(dispatch, actions.closeTab),
    openTabContextMenu: dispatcher(dispatch, actions.openTabContextMenu),
  }),
});
