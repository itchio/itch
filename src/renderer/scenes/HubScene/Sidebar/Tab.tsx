import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import { formatDurationAsMessage } from "common/format/datetime";
import {
  Dispatch,
  DownloadsState,
  LocalizedString,
  MenuTemplate,
  TabInstance,
} from "common/types";
import { ambientWind, ambientWindState } from "common/util/navigation";
import uuid from "common/util/uuid";
import {
  getActiveDownload,
  getPendingDownloads,
} from "main/reactors/downloads/getters";
import React from "react";
import { injectIntl, IntlShape } from "react-intl";
import { hookWithProps } from "renderer/hocs/hook";
import modals from "renderer/modals";
import Item from "renderer/scenes/HubScene/Sidebar/Item";

class Tab extends React.PureComponent<Props> {
  onClick = () => {
    const { tab, dispatch } = this.props;
    dispatch(actions.tabFocused({ wind: ambientWind(), tab }));
  };

  onClose = () => {
    const { tab, dispatch } = this.props;
    dispatch(actions.closeTab({ wind: ambientWind(), tab }));
  };

  onContextMenu = (ev: React.MouseEvent<HTMLElement>) => {
    const { tab, tabInstance, dispatch } = this.props;
    ev.preventDefault();
    const wind = ambientWind();

    const template: MenuTemplate = [];

    const { location } = tabInstance;
    const url = location ? location.url : null;
    if (url) {
      template.push({
        localizedLabel: ["sidebar.duplicate_tab"],
        action: actions.tabOpened({
          wind,
          tab: uuid(),
          insertAfter: tab,
          url,
          resource: tabInstance.resource
            ? tabInstance.resource.value
            : undefined,
        }),
      });
      template.push({ type: "separator" });
    }

    template.push({
      localizedLabel: ["sidebar.close_tab"],
      action: actions.closeTab({ wind, tab }),
    });
    template.push({
      localizedLabel: ["sidebar.close_other_tabs"],
      action: actions.closeOtherTabs({ wind, tab }),
    });
    template.push({
      localizedLabel: ["sidebar.close_tabs_below"],
      action: actions.closeTabsBelow({ wind, tab }),
    });

    dispatch(
      actions.popupContextMenu({
        wind,
        clientX: ev.clientX,
        clientY: ev.clientY,
        template,
      })
    );
  };

  override render() {
    const { tab, sortable, tabInstance, active } = this.props;
    const { onExplore } = this;

    const { location, status } = tabInstance;
    let loading = tabInstance.loading;

    const url = location ? location.url : null;
    const resource = tabInstance.resource ? tabInstance.resource.value : null;
    const label = status ? status.lazyLabel : null;
    let icon = status ? status.icon : null;
    let count = 0;
    let progress: number | null = null;
    let sublabel: LocalizedString | null = null;

    if (tab === "itch://downloads") {
      const { downloads } = this.props;
      if (downloads) {
        count = getPendingDownloads(downloads).length;
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
    }

    let gameOverride: Game | null = null;
    let { onClick } = this;
    let onClose: (() => void) | null = this.onClose;
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
      onContextMenu: this.onContextMenu,
      onExplore,
      sublabel,
      gameOverride,
      loading,
    };

    return <Item key={tab} {...props} />;
  }

  onExplore = (tab: string) => {
    const { dispatch, tabInstance } = this.props;

    dispatch(
      actions.openModal(
        modals.exploreJson.make({
          wind: ambientWind(),
          title: "Tab information",
          message: "",
          widgetParams: {
            data: { tab, tabInstance },
          },
          fullscreen: true,
        })
      )
    );
  };
}

interface Props {
  tab: string;
  active: boolean;
  sortable?: boolean;

  tabInstance: TabInstance;
  downloads: DownloadsState | null;
  dispatch: Dispatch;

  intl: IntlShape;
}

export default injectIntl(
  hookWithProps(Tab)((map) => ({
    tabInstance: map((rs, p) => ambientWindState(rs).tabInstances[p.tab]),
    downloads: map((rs, p) =>
      p.tab === "itch://downloads" ? rs.downloads : null
    ),
  }))(Tab)
);
