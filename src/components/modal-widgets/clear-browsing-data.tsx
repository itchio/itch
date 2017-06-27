import * as React from "react";
import * as classNames from "classnames";
import { connect, I18nProps } from "../connect";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import partitionForUser from "../../util/partition-for-user";
import * as humanize from "humanize-plus";

import LoadingCircle from "../basics/loading-circle";

import * as electron from "electron";

// TODO: So maybe this is a good place to clear downloads too
// I dunno, just a though. Like technically they shouldn't even
// stay long (should be cleaned up after install etc.)
// but yeah.

export class ClearBrowsingData extends React.PureComponent<
  IProps & IDerivedProps & I18nProps,
  IState
> {
  constructor() {
    super();
    this.state = {
      fetchedCacheSize: false,
      clearCache: true,
      clearCookies: false,
    };
  }

  componentDidMount() {
    const { userId } = this.props;

    // FIXME: surely we can do that without remote ?
    // more surely: that surely should just be done in metal
    // and we should read from store or something
    const ourSession = electron.remote.session.fromPartition(
      partitionForUser(String(userId)),
      {},
    );

    ourSession.getCacheSize(cacheSize => {
      this.setState({
        fetchedCacheSize: true,
        cacheSize,
      });
    });
  }

  change(state: Partial<IState>) {
    const mergedState = {
      ...this.state,
      ...state,
    };

    this.props.updatePayload({
      cache: mergedState.clearCache,
      cookies: mergedState.clearCookies,
    });

    this.setState(mergedState);
  }

  toggleCache = () => {
    this.change({ clearCache: !this.state.clearCache });
  };

  toggleCookies = () => {
    this.change({ clearCookies: !this.state.clearCookies });
  };

  render() {
    const { t } = this.props;
    const {
      fetchedCacheSize,
      cacheSize,
      clearCache,
      clearCookies,
    } = this.state;

    return (
      <ModalWidgetDiv>
        <div className="clear-browsing-data-list">
          <label className={classNames({ active: clearCache })}>
            <div className="checkbox">
              <input
                type="checkbox"
                id="clear-cache-checkbox"
                checked={clearCache}
                onChange={this.toggleCache}
              />
              {t("prompt.clear_browsing_data.category.cache")}
            </div>
            <div className="checkbox-info">
              {fetchedCacheSize
                ? t("prompt.clear_browsing_data.cache_size_used", {
                    size: humanize.fileSize(cacheSize),
                  })
                : [
                    <LoadingCircle progress={0.1} />,
                    " ",
                    t("prompt.clear_browsing_data.retrieving_cache_size"),
                  ]}
            </div>
          </label>
          <label className={classNames({ active: clearCookies })}>
            <div className="checkbox">
              <input
                type="checkbox"
                id="clear-cookies-checkbox"
                checked={clearCookies}
                onChange={this.toggleCookies}
              />
              {t("prompt.clear_browsing_data.category.cookies")}
            </div>
            <div className="checkbox-info">
              {t("prompt.clear_browsing_data.cookies_info")}
            </div>
          </label>
        </div>
      </ModalWidgetDiv>
    );
  }
}

export interface IClearBrowsingDataParams {}

interface IProps extends IModalWidgetProps {}

interface IDerivedProps {
  userId: number;
}

interface IState {
  fetchedCacheSize?: boolean;
  cacheSize?: number;

  clearCache?: boolean;
  clearCookies?: boolean;
}

export default connect<IProps>(ClearBrowsingData, {
  state: state => ({
    userId: state.session.credentials.me.id,
  }),
});
