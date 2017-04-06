
import * as React from "react";
import * as classNames from "classnames";
import {connect, I18nProps} from "../connect";

import {IModalWidgetProps} from "./modal-widget";

import partitionForUser from "../../util/partition-for-user";
import * as humanize from "humanize-plus";

import LoadingCircle from "../loading-circle";

import "electron";

export class ClearBrowsingData extends React.Component<IProps & IDerivedProps & I18nProps, IClearBrowsingDataState> {
  constructor () {
    super();
    this.state = {
      fetchedCacheSize: false,
      clearCache: true,
      clearCookies: false,
    };
  }

  componentDidMount() {
    const {userId} = this.props;

    // FIXME: surely there's something less horrible we can do?
    const {session} = require("electron").remote.require("electron");
    const ourSession = session.fromPartition(partitionForUser(String(userId))) as Electron.Session;

    ourSession.getCacheSize((cacheSize) => {
      this.setState({
        fetchedCacheSize: true,
        cacheSize,
      });

      this.onChange();
    });
  }

  onChange () {
    this.props.updatePayload({
      cache: this.state.clearCache,
      cookies: this.state.clearCookies,
    });
  }

  render () {
    const {t} = this.props;
    const {fetchedCacheSize, cacheSize, clearCache, clearCookies} = this.state;

    return <div className="modal-widget">
      <div className="clear-browsing-data-list">
      <label className={classNames({active: clearCache})}>
          <div className="checkbox">
            <input type="checkbox"
                checked={clearCache}
                onChange={(e) => { this.setState({clearCache: e.currentTarget.checked}); this.onChange(); }}/>
              {t("prompt.clear_browsing_data.category.cache")}
          </div>
          <div className="checkbox-info">
            {fetchedCacheSize
            ? t("prompt.clear_browsing_data.cache_size_used", {size: humanize.fileSize(cacheSize)})
            : [<LoadingCircle progress={0.1}/>, " ", t("prompt.clear_browsing_data.retrieving_cache_size") ]
            }
            
          </div>
        </label>
        <label className={classNames({active: clearCookies})}>
          <div className="checkbox">
            <input type="checkbox"
              checked={clearCookies}
              onChange={(e) => { this.setState({clearCookies: e.currentTarget.checked}); this.onChange(); }}/>
                {t("prompt.clear_browsing_data.category.cookies")}
          </div>
          <div className="checkbox-info">
            {t("prompt.clear_browsing_data.cookies_info")}
          </div>
        </label>
      </div>
    </div>;
  }
}

export interface IClearBrowsingDataParams {}

interface IProps extends IModalWidgetProps {}

interface IDerivedProps {
  userId: number;
}

interface IClearBrowsingDataState {
  fetchedCacheSize?: boolean;
  cacheSize?: number;

  clearCache?: boolean;
  clearCookies?: boolean;
}

export default connect<IProps>(ClearBrowsingData, {
  state: (state) => ({
    userId: state.session.credentials.me.id,
  }),
});
