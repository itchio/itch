import * as React from "react";
import { SortableElement } from "react-sortable-hoc";
import { createStructuredSelector } from "reselect";

import Item from "./item";

import { connect, actionCreatorsList, Dispatchers } from "../connect";

import { size } from "underscore";
import {
  getFinishedDownloads,
  getActiveDownload,
} from "../../reactors/downloads/getters";

import {
  IRootState,
  ITabData,
  ILocalizedString,
  IDownloadsState,
} from "../../types";

import { injectIntl, InjectedIntl } from "react-intl";
import { formatDurationAsMessage } from "../../format/datetime";
import { Space } from "../../helpers/space";
import { Game } from "ts-itchio-api";

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

  onContextMenu = (ev: React.MouseEvent<any>) => {
    const { tab, openTabContextMenu } = this.props;
    openTabContextMenu({ tab, clientX: ev.clientX, clientY: ev.pageY });
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
    let icon = sp.icon();
    let count = 0;
    let progress: number = null;
    let sublabel: ILocalizedString = null;

    if (tab === "downloads") {
      const { downloads } = this.props;
      count = size(getFinishedDownloads(downloads));
      const activeDownload = getActiveDownload(downloads);
      if (activeDownload) {
        progress = activeDownload.progress;
        if (downloads.paused) {
          icon = "stopwatch";
          sublabel = ["grid.item.downloads_paused"];
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

    let gameOverride: Game = null;
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

const actionCreators = actionCreatorsList(
  "navigate",
  "closeTab",
  "openModal",
  "openTabContextMenu"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  data: ITabData;
  loading: boolean;
  downloads?: IDownloadsState;

  intl: InjectedIntl;
};

const Tab = connect<IProps>(injectIntl(TabBase), {
  state: (initialState, initialProps) => {
    let { tab } = initialProps;

    return createStructuredSelector({
      data: (rs: IRootState) => rs.session.tabData[tab] || eo,
      loading: (rs: IRootState) => !!rs.session.navigation.loadingTabs[tab],
      downloads: (rs: IRootState) => tab === "downloads" && rs.downloads,
    });
  },
  actionCreators,
});

export default Tab;
