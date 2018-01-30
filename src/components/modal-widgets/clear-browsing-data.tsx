import * as React from "react";
import * as classNames from "classnames";
import { connect } from "../connect";

import partitionForUser from "../../util/partition-for-user";

import LoadingCircle from "../basics/loading-circle";

import * as electron from "electron";

import format from "../format";
import { fileSize } from "../../format/filesize";
import { IModalWidgetProps } from "./index";
import { ModalWidgetDiv } from "./modal-widget";

class ClearBrowsingData extends React.PureComponent<
  IProps & IDerivedProps,
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
      { cache: true }
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
    const {
      fetchedCacheSize,
      cacheSize,
      clearCache,
      clearCookies,
    } = this.state;

    // chrome sometimes return negative values (-2 B)
    const shownCacheSize = cacheSize < 0 ? 0 : cacheSize;

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
              {format(["prompt.clear_browsing_data.category.cache"])}
            </div>
            <div className="checkbox-info">
              {fetchedCacheSize ? (
                format([
                  "prompt.clear_browsing_data.cache_size_used",
                  {
                    size: fileSize(shownCacheSize),
                  },
                ])
              ) : (
                <span>
                  <LoadingCircle progress={0.1} />{" "}
                  {format([
                    "prompt.clear_browsing_data.retrieving_cache_size",
                  ])},
                </span>
              )}
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
              {format(["prompt.clear_browsing_data.category.cookies"])}
            </div>
            <div className="checkbox-info">
              {format(["prompt.clear_browsing_data.cookies_info"])}
            </div>
          </label>
        </div>
      </ModalWidgetDiv>
    );
  }
}

export interface IClearBrowsingDataParams {}
export interface IClearBrowsingDataResponse {
  /** whether to clear cookies */
  cookies?: boolean;

  /** whether to clear cache */
  cache?: boolean;
}

interface IProps
  extends IModalWidgetProps<
      IClearBrowsingDataParams,
      IClearBrowsingDataResponse
    > {}

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
