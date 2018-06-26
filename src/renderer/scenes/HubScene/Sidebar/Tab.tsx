import React from "react";
import { SortableElement } from "react-sortable-hoc";
import { createStructuredSelector } from "reselect";

import Item from "./Item";

import {
  connect,
  actionCreatorsList,
  Dispatchers,
} from "renderer/hocs/connect";

import { size } from "underscore";

import {
  RootState,
  TabInstance,
  LocalizedString,
  DownloadsState,
} from "common/types";

import { injectIntl, InjectedIntl } from "react-intl";
import { formatDurationAsMessage } from "common/format/datetime";
import { Space } from "common/helpers/space";
import { Game } from "common/butlerd/messages";
import {
  getActiveDownload,
  getPendingDownloads,
} from "main/reactors/downloads/getters";
import {
  rendererWindowState,
  rendererNavigation,
  rendererWindow,
} from "common/util/navigation";
import { modalWidgets } from "renderer/modal-widgets";

interface SortableHubSidebarItemProps {
  props: any & {
    tab: string;
  };
}

const SortableItem = SortableElement((props: SortableHubSidebarItemProps) => {
  return <Item {...props.props} />;
});

class TabBase extends React.PureComponent<Props & DerivedProps> {
  onClick = () => {
    const { tab, focusTab } = this.props;
    focusTab({ window: rendererWindow(), tab });
  };

  onClose = () => {
    const { tab, closeTab } = this.props;
    closeTab({ window: rendererWindow(), tab });
  };

  render() {
    const { tab, index, sortable, tabInstance, active } = this.props;
    const { onExplore } = this;

    const space = Space.fromInstance(tab, tabInstance);
    let loading = this.props.loading || space.web().loading;

    const url = space.url();
    const resource = space.resource();
    const label = space.label();
    let icon = space.icon();
    let count = 0;
    let progress: number = null;
    let sublabel: LocalizedString = null;

    if (tab === "itch://downloads") {
      const { downloads } = this.props;
      count = size(getPendingDownloads(downloads));
      const activeDownload = getActiveDownload(downloads);
      if (activeDownload) {
        const downloadProgress = downloads.progresses[activeDownload.id];
        if (downloads.paused) {
          icon = "stopwatch";
          sublabel = ["grid.item.downloads_paused"];
        } else if (downloadProgress && downloadProgress.eta) {
          progress = downloadProgress.progress;
          const title = activeDownload.game.title;
          const { intl } = this.props;
          const formatted = formatDurationAsMessage(downloadProgress.eta);
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

    let gameOverride: Game = null;
    let { onClick, onClose } = this;
    if (!sortable) {
      onClose = null;
    }

    const props = {
      tab,
      url,
      resource,
      tabInstance,
      label,
      icon,
      active,
      onClick,
      count,
      progress,
      onClose,
      onExplore,
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
    const { tabInstance } = this.props;

    this.props.openModal(
      modalWidgets.exploreJson.make({
        window: rendererWindow(),
        title: "Tab information",
        message: "",
        widgetParams: {
          data: { tab, tabInstance },
        },
        fullscreen: true,
      })
    );
  };
}

interface Props {
  tab: string;
  index?: number;
  active: boolean;
  sortable?: boolean;
}

const actionCreators = actionCreatorsList(
  "navigate",
  "focusTab",
  "closeTab",
  "openModal"
);

type DerivedProps = Dispatchers<typeof actionCreators> & {
  tabInstance: TabInstance;
  loading: boolean;
  downloads?: DownloadsState;

  intl: InjectedIntl;
};

const Tab = connect<Props>(
  injectIntl(TabBase),
  {
    state: (initialState, initialProps) => {
      let { tab } = initialProps;

      return createStructuredSelector<RootState, any>({
        tabInstance: (rs: RootState) =>
          rendererWindowState(rs).tabInstances[tab],
        loading: (rs: RootState) => !!rendererNavigation(rs).loadingTabs[tab],
        downloads: (rs: RootState) =>
          tab === "itch://downloads" && rs.downloads,
      });
    },
    actionCreators,
  }
);

export default Tab;
