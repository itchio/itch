
import * as React from "react";
import {SortableElement} from "react-sortable-hoc";
import {createStructuredSelector} from "reselect";

import * as moment from "moment";
import Item from "./item";

import {pathToIcon, makeLabel} from "../../util/navigation";
import {connect, I18nProps} from "../connect";

import * as actions from "../../actions";
import {dispatcher} from "../../constants/action-types";

import {
  ITabData,
  IGameRecord,
  ILocalizedString,
  IDownloadsState,
} from "../../types";

interface ISortableHubSidebarItemProps {
  props: any & {
    id: string;
  };
}

const SortableItem = SortableElement((props: ISortableHubSidebarItemProps) => {
  return <Item {...props.props}/>;
});

class Tab extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, id, index, sortable, data, active, loading} = this.props;
    const {navigate, closeTab, openTabContextMenu} = this.props;

    const {path} = data;
    let iconImage = data.iconImage;
    if (/^url/.test(path)) {
      iconImage = data.webFavicon;
    }
    
    const label = makeLabel(id, data);
    const icon = pathToIcon(path);
    const onClick = () => navigate(id);
    let onClose;
    if (sortable) {
      onClose = () => closeTab({id});
    }
    const onContextMenu = () => openTabContextMenu({id});
    let count = 0;
    let progress = 0;
    let sublabel: ILocalizedString = null;

    if (id === "downloads") {
      const {downloads} = this.props;
      count = downloads.finishedDownloads.length;
      progress = downloads.progress;
      const {activeDownload} = downloads;
      if (activeDownload) {
        if (downloads.downloadsPaused) {
          sublabel = ["grid.item.downloads_paused"];
        } else {
          const title = activeDownload.game.title;
          const duration = moment.duration(activeDownload.eta, "seconds") as any;
          // silly typings, durations have locales!
          const humanDuration = duration.locale(t.lang).humanize();
          sublabel = `${title} — ${humanDuration}`;
        }
      }
    }

    let gameOverride: IGameRecord = null;

    const props = {id, path, label, icon, iconImage, active,
      onClick, count, progress, onClose, onContextMenu, data, t,
      sublabel, gameOverride, loading};
    
    if (sortable) {
      return <SortableItem key={id} index={index} props={props}/>;
    } else {
      return <Item key={id} {...props}/>;
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
}

export default connect<IProps>(Tab, {
  state: (initialState, initialProps) => {
    let {id} = initialProps;

    return createStructuredSelector({
      data: (state) => state.session.navigation.tabData[id] || {},
      loading: (state) => !!state.session.navigation.loadingTabs[id],
      downloads: (state) => (id === "downloads" && state.downloads),
    });
  },
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
    closeTab: dispatcher(dispatch, actions.closeTab),
    openTabContextMenu: dispatcher(dispatch, actions.openTabContextMenu),
  }),
});
