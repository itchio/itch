import * as React from "react";
import { SortableElement } from "react-sortable-hoc";
import { createStructuredSelector } from "reselect";

import Item from "./item";

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
import { Space } from "../../helpers/space";

interface ISortableHubSidebarItemProps {
  props: any & {
    tab: string;
  };
}

const eo: any = {};

const SortableItem = SortableElement((props: ISortableHubSidebarItemProps) => {
  return <Item {...props.props} />;
});

class TabBase extends React.PureComponent<IProps & IDerivedProps> {
  onClick = () => {
    const { tab, navigate } = this.props;
    navigate({ tab });
  };

  onClose = () => {
    const { tab, closeTab } = this.props;
    closeTab({ tab });
  };

  onContextMenu = () => {
    const { tab, openTabContextMenu } = this.props;
    openTabContextMenu({ tab });
  };

  render() {
    const { tab, index, sortable, data, active } = this.props;
    const { onExplore } = this;

    const sp = Space.fromData(data);
    let loading = this.props.loading || sp.web().loading;
    const path = data.path || tab;

    let iconImage = sp.image();
    if (sp.prefix === "url") {
      iconImage = (data.web || eo).favicon;
    }

    const label = sp.label();
    const icon = sp.icon();
    let count = 0;
    let progress = 0;
    let sublabel: ILocalizedString = null;

    if (tab === "downloads") {
      const { downloads } = this.props;
      count = size(getFinishedDownloads(downloads));
      const activeDownload = getActiveDownload(downloads);
      if (activeDownload) {
        progress = activeDownload.progress;
        if (downloads.paused) {
          const { intl } = this.props;
          sublabel = intl.formatMessage({ id: "grid.item.downloads_paused" });
        } else if (activeDownload.eta) {
          const title = activeDownload.game.title;
          const { intl } = this.props;
          const formatted = formatDurationAsMessage(activeDownload.eta);
          const humanDuration = intl.formatMessage(
            {
              id: formatted.id,
            },
            formatted.values
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
      tab,
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
      onExplore,
      data,
      sublabel,
      gameOverride,
      loading,
    };

    if (sortable) {
      return <SortableItem key={tab} index={index} props={props} />;
    } else {
      return <Item key={tab} {...props} />;
    }
  }

  onExplore = (tab: string) => {
    this.props.openModal({
      title: "Tab data",
      message: "",
      widget: "explore-json",
      widgetParams: {
        data: this.props.data,
      },
    });
  };
}

interface IProps {
  tab: string;
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
  openModal: typeof actions.openModal;
  openTabContextMenu: typeof actions.openTabContextMenu;

  intl: InjectedIntl;
}

const Tab = connect<IProps>(injectIntl(TabBase), {
  state: (initialState, initialProps) => {
    let { tab } = initialProps;

    return createStructuredSelector({
      data: (state: IAppState) => state.session.tabData[tab] || eo,
      loading: (state: IAppState) =>
        !!state.session.navigation.loadingTabs[tab],
      downloads: (state: IAppState) => tab === "downloads" && state.downloads,
    });
  },
  dispatch: dispatch => ({
    navigate: dispatcher(dispatch, actions.navigate),
    closeTab: dispatcher(dispatch, actions.closeTab),
    openModal: dispatcher(dispatch, actions.openModal),
    openTabContextMenu: dispatcher(dispatch, actions.openTabContextMenu),
  }),
});

export default Tab;
